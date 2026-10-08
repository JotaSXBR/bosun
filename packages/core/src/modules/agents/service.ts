import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";
import { captureException } from "@crm/observability";

import { DomainError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { recordAuditEvent } from "../audit";
import type { AgentRow } from "./repository";
import {
  deleteAgent,
  findAgentById,
  insertAgent,
  listAgents as repoListAgents,
  updateAgent as repoUpdateAgent,
} from "./repository";
import type { CreateAgentInput, UpdateAgentInput } from "./schemas";
import { createAgentInput, updateAgentInput } from "./schemas";

/** postgres.js unique violations surface on `cause` — check both levels. */
function isNameConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 2 && current; depth += 1) {
    const pg = current as { code?: string; constraint_name?: string; cause?: unknown };
    if (pg.code === "23505" && pg.constraint_name === "agents_org_name_idx") return true;
    current = pg.cause;
  }
  return false;
}

function nameTaken(): never {
  throw new DomainError("AGENT_NAME_TAKEN", "An agent with this name already exists");
}

/** Audit is post-commit best-effort — a logging failure must not fail the mutation. */
function audit(db: Database, ctx: TenantContext, action: string, agentId: string): void {
  recordAuditEvent(db, ctx, {
    action,
    targetType: "agent",
    targetId: agentId,
    metadata: { agentId },
  }).catch((error: unknown) => captureException(error, { module: "agents", action }));
}

/** Requires ai:read. */
export async function listAgents(db: Database, ctx: TenantContext): Promise<AgentRow[]> {
  assertPermission(ctx, { ai: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => repoListAgents(tx, ctx.organizationId));
}

/** Requires ai:manage. */
export async function createAgent(
  db: Database,
  ctx: TenantContext,
  input: CreateAgentInput,
): Promise<AgentRow> {
  assertPermission(ctx, { ai: ["manage"] });
  const parsed = createAgentInput.parse(input);
  const agent = await withTenant(db, ctx.organizationId, async (tx) => {
    try {
      return await insertAgent(tx, { organizationId: ctx.organizationId, ...parsed });
    } catch (error) {
      if (isNameConflict(error)) nameTaken();
      throw error;
    }
  });
  audit(db, ctx, "agent.created", agent.id);
  return agent;
}

/** Requires ai:manage. */
export async function updateAgent(
  db: Database,
  ctx: TenantContext,
  input: UpdateAgentInput,
): Promise<AgentRow> {
  assertPermission(ctx, { ai: ["manage"] });
  const parsed = updateAgentInput.parse(input);
  const agent = await withTenant(db, ctx.organizationId, async (tx) => {
    const existing = await findAgentById(tx, ctx.organizationId, parsed.agentId);
    if (!existing) throw new NotFoundError("Agent", parsed.agentId);
    const { agentId: _, ...fields } = parsed;
    let updated: AgentRow | undefined;
    try {
      updated = await repoUpdateAgent(tx, existing.id, fields);
    } catch (error) {
      if (isNameConflict(error)) nameTaken();
      throw error;
    }
    if (!updated) throw new NotFoundError("Agent", parsed.agentId);
    return updated;
  });
  audit(db, ctx, "agent.updated", agent.id);
  return agent;
}

/** Requires ai:manage. */
export async function deleteAgentById(
  db: Database,
  ctx: TenantContext,
  agentId: string,
): Promise<void> {
  assertPermission(ctx, { ai: ["manage"] });
  await withTenant(db, ctx.organizationId, async (tx) => {
    const existing = await findAgentById(tx, ctx.organizationId, agentId);
    if (!existing) throw new NotFoundError("Agent", agentId);
    await deleteAgent(tx, existing.id);
  });
  audit(db, ctx, "agent.deleted", agentId);
}
