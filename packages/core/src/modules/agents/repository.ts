import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, asc, eq } from "drizzle-orm";

const { agents } = schema;

export type AgentRow = typeof agents.$inferSelect;

export async function listAgents(
  executor: DbExecutor,
  organizationId: string,
): Promise<AgentRow[]> {
  return executor
    .select()
    .from(agents)
    .where(eq(agents.organizationId, organizationId))
    .orderBy(asc(agents.name));
}

export async function findAgentById(
  executor: DbExecutor,
  organizationId: string,
  agentId: string,
): Promise<AgentRow | null> {
  const [row] = await executor
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export async function insertAgent(
  executor: DbExecutor,
  values: {
    organizationId: string;
    name: string;
    specialty?: string | null;
    status: string;
    modelRef?: unknown;
    systemPrompt: string;
    businessRules?: string | null;
    toolsAllowlist: unknown;
    availabilityWindow?: unknown;
    memoryTokenCap?: number | null;
    toolExecutionLimit?: number | null;
    signatureLine?: string | null;
  },
): Promise<AgentRow> {
  const [row] = await executor.insert(agents).values(values).returning();
  if (!row) throw new Error("agents insert returned no row");
  return row;
}

export async function updateAgent(
  executor: DbExecutor,
  agentId: string,
  values: Partial<{
    name: string;
    specialty: string | null;
    status: string;
    modelRef: unknown;
    systemPrompt: string;
    businessRules: string | null;
    toolsAllowlist: unknown;
    availabilityWindow: unknown;
    memoryTokenCap: number | null;
    toolExecutionLimit: number | null;
    signatureLine: string | null;
  }>,
): Promise<AgentRow | undefined> {
  const [row] = await executor
    .update(agents)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(agents.id, agentId))
    .returning();
  return row;
}

export async function deleteAgent(executor: DbExecutor, agentId: string): Promise<boolean> {
  const rows = await executor
    .delete(agents)
    .where(eq(agents.id, agentId))
    .returning({ id: agents.id });
  return rows.length > 0;
}
