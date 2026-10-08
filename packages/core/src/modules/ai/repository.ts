import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, asc, eq } from "drizzle-orm";

const { aiUsageEvents, orgLlmCredentials } = schema;

export type OrgLlmCredentialRow = typeof orgLlmCredentials.$inferSelect;
/** Public shape — never carries `apiKeyEncrypted`. */
export type LlmCredentialPublic = Omit<OrgLlmCredentialRow, "apiKeyEncrypted">;

const publicColumns = {
  id: orgLlmCredentials.id,
  organizationId: orgLlmCredentials.organizationId,
  provider: orgLlmCredentials.provider,
  label: orgLlmCredentials.label,
  model: orgLlmCredentials.model,
  priority: orgLlmCredentials.priority,
  zdr: orgLlmCredentials.zdr,
  status: orgLlmCredentials.status,
  createdAt: orgLlmCredentials.createdAt,
  updatedAt: orgLlmCredentials.updatedAt,
} as const;

export async function listCredentials(
  executor: DbExecutor,
  organizationId: string,
): Promise<LlmCredentialPublic[]> {
  return executor
    .select(publicColumns)
    .from(orgLlmCredentials)
    .where(eq(orgLlmCredentials.organizationId, organizationId))
    .orderBy(asc(orgLlmCredentials.priority), asc(orgLlmCredentials.createdAt));
}

export async function findCredential(
  executor: DbExecutor,
  organizationId: string,
  credentialId: string,
): Promise<LlmCredentialPublic | null> {
  const [row] = await executor
    .select(publicColumns)
    .from(orgLlmCredentials)
    .where(
      and(
        eq(orgLlmCredentials.id, credentialId),
        eq(orgLlmCredentials.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Internal — returns the encrypted payload, ordered by fallback priority.
 * Only called from trusted system paths (observer job), inside withTenant.
 */
export async function listActiveCredentialsEncrypted(
  executor: DbExecutor,
  organizationId: string,
): Promise<OrgLlmCredentialRow[]> {
  return executor
    .select()
    .from(orgLlmCredentials)
    .where(
      and(
        eq(orgLlmCredentials.organizationId, organizationId),
        eq(orgLlmCredentials.status, "active"),
      ),
    )
    .orderBy(asc(orgLlmCredentials.priority), asc(orgLlmCredentials.createdAt));
}

export async function insertCredential(
  executor: DbExecutor,
  values: {
    organizationId: string;
    provider: string;
    apiKeyEncrypted: string;
    label?: string | null;
    model: string;
    priority: number;
    zdr: boolean;
  },
): Promise<LlmCredentialPublic> {
  const [row] = await executor.insert(orgLlmCredentials).values(values).returning(publicColumns);
  if (!row) throw new Error("org_llm_credentials insert returned no row");
  return row;
}

export async function updateCredential(
  executor: DbExecutor,
  credentialId: string,
  values: Partial<{
    label: string | null;
    model: string;
    priority: number;
    zdr: boolean;
    status: string;
    apiKeyEncrypted: string;
  }>,
): Promise<LlmCredentialPublic | undefined> {
  const [row] = await executor
    .update(orgLlmCredentials)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(orgLlmCredentials.id, credentialId))
    .returning(publicColumns);
  return row;
}

export async function deleteCredential(
  executor: DbExecutor,
  credentialId: string,
): Promise<boolean> {
  const rows = await executor
    .delete(orgLlmCredentials)
    .where(eq(orgLlmCredentials.id, credentialId))
    .returning({ id: orgLlmCredentials.id });
  return rows.length > 0;
}

export type UsageEventInsert = {
  agentId?: string | null;
  credentialId?: string | null;
  callKind: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs?: number | null;
  status: string;
};

export async function insertUsageEvents(
  executor: DbExecutor,
  organizationId: string,
  events: UsageEventInsert[],
): Promise<void> {
  if (events.length === 0) return;
  await executor.insert(aiUsageEvents).values(events.map((e) => ({ ...e, organizationId })));
}
