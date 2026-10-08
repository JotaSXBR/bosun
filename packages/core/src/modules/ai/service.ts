import type { Database, DbExecutor } from "@crm/db";
import { withTenant } from "@crm/db";

import { DomainError, NotFoundError } from "../../errors";
import { decryptJson, encryptJson } from "../../lib/crypto";
import { isUniqueViolation } from "../../lib/pg-error";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { LlmCredentialPublic, OrgLlmCredentialRow, UsageEventInsert } from "./repository";
import {
  deleteCredential,
  findCredential,
  insertCredential,
  insertUsageEvents,
  listActiveCredentialsEncrypted,
  listCredentials,
  updateCredential,
} from "./repository";
import type { CreateLlmCredentialInput, UpdateLlmCredentialInput } from "./schemas";
import { createLlmCredentialInput, updateLlmCredentialInput } from "./schemas";

const PRIORITY_CONSTRAINT = "org_llm_credentials_org_provider_priority_idx";

function priorityTaken(): never {
  throw new DomainError(
    "LLM_PRIORITY_TAKEN",
    "A credential with this provider and priority already exists",
  );
}

/** Requires ai:read. Key material is never returned. */
export async function listLlmCredentials(
  db: Database,
  ctx: TenantContext,
): Promise<LlmCredentialPublic[]> {
  assertPermission(ctx, { ai: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => listCredentials(tx, ctx.organizationId));
}

/** Requires ai:manage. `apiKey` is AES-256-GCM'd before it touches the DB. */
export async function createLlmCredential(
  db: Database,
  ctx: TenantContext,
  input: CreateLlmCredentialInput,
): Promise<LlmCredentialPublic> {
  assertPermission(ctx, { ai: ["manage"] });
  const parsed = createLlmCredentialInput.parse(input);
  const apiKeyEncrypted = encryptJson({ apiKey: parsed.apiKey });
  return withTenant(db, ctx.organizationId, async (tx) => {
    try {
      return await insertCredential(tx, {
        organizationId: ctx.organizationId,
        provider: parsed.provider,
        apiKeyEncrypted,
        label: parsed.label,
        model: parsed.model,
        priority: parsed.priority,
        zdr: parsed.zdr,
      });
    } catch (error) {
      if (isUniqueViolation(error, PRIORITY_CONSTRAINT)) priorityTaken();
      throw error;
    }
  });
}

/** Requires ai:manage. `apiKey` (when present) rotates the stored key. */
export async function updateLlmCredential(
  db: Database,
  ctx: TenantContext,
  input: UpdateLlmCredentialInput,
): Promise<LlmCredentialPublic> {
  assertPermission(ctx, { ai: ["manage"] });
  const parsed = updateLlmCredentialInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const existing = await findCredential(tx, ctx.organizationId, parsed.credentialId);
    if (!existing) throw new NotFoundError("LlmCredential", parsed.credentialId);
    const { apiKey, ...fields } = parsed;
    let updated: LlmCredentialPublic | undefined;
    try {
      updated = await updateCredential(tx, existing.id, {
        ...fields,
        ...(apiKey ? { apiKeyEncrypted: encryptJson({ apiKey }) } : {}),
      });
    } catch (error) {
      if (isUniqueViolation(error, PRIORITY_CONSTRAINT)) priorityTaken();
      throw error;
    }
    if (!updated) throw new NotFoundError("LlmCredential", parsed.credentialId);
    return updated;
  });
}

/** Requires ai:manage. */
export async function deleteLlmCredential(
  db: Database,
  ctx: TenantContext,
  credentialId: string,
): Promise<void> {
  assertPermission(ctx, { ai: ["manage"] });
  await withTenant(db, ctx.organizationId, async (tx) => {
    const existing = await findCredential(tx, ctx.organizationId, credentialId);
    if (!existing) throw new NotFoundError("LlmCredential", credentialId);
    await deleteCredential(tx, existing.id);
  });
}

/**
 * Internal — trusted system paths only (observer job). Decrypts active
 * credentials ordered by priority. The caller must already be inside a
 * tenant-scoped context (`withTenant`).
 */
export async function resolveOrgLlmCredentials(
  executor: DbExecutor,
  organizationId: string,
): Promise<
  Array<{
    id: string;
    provider: OrgLlmCredentialRow["provider"];
    apiKey: string;
    model: string;
    zdr: boolean;
  }>
> {
  const rows = await listActiveCredentialsEncrypted(executor, organizationId);
  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    apiKey: decryptJson<{ apiKey: string }>(row.apiKeyEncrypted).apiKey,
    model: row.model,
    zdr: row.zdr,
  }));
}

/**
 * Internal — records one row per LLM call attempt (fallback chain). The
 * caller must already be inside a tenant-scoped context (`withTenant`).
 */
export async function recordUsageEvents(
  executor: DbExecutor,
  organizationId: string,
  events: UsageEventInsert[],
): Promise<void> {
  await insertUsageEvents(executor, organizationId, events);
}
