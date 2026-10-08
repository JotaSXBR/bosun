import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, desc, eq } from "drizzle-orm";

const { agentSuggestions } = schema;

export type AgentSuggestionRow = typeof agentSuggestions.$inferSelect;

export async function listSuggestions(
  executor: DbExecutor,
  organizationId: string,
  filter: { status?: string; limit: number },
): Promise<AgentSuggestionRow[]> {
  return executor
    .select()
    .from(agentSuggestions)
    .where(
      filter.status
        ? and(
            eq(agentSuggestions.organizationId, organizationId),
            eq(agentSuggestions.status, filter.status),
          )
        : eq(agentSuggestions.organizationId, organizationId),
    )
    .orderBy(desc(agentSuggestions.createdAt))
    .limit(filter.limit);
}

export async function findSuggestionById(
  executor: DbExecutor,
  organizationId: string,
  suggestionId: string,
): Promise<AgentSuggestionRow | null> {
  const [row] = await executor
    .select()
    .from(agentSuggestions)
    .where(
      and(
        eq(agentSuggestions.id, suggestionId),
        eq(agentSuggestions.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Pending suggestions emitted for one conversation — the dedupe guard. */
export async function listPendingForConversation(
  executor: DbExecutor,
  organizationId: string,
  sourceConversationId: string,
): Promise<AgentSuggestionRow[]> {
  return executor
    .select()
    .from(agentSuggestions)
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.sourceConversationId, sourceConversationId),
        eq(agentSuggestions.status, "pending"),
      ),
    );
}

export async function insertSuggestion(
  executor: DbExecutor,
  values: {
    organizationId: string;
    targetType: string;
    targetId?: string | null;
    payload: unknown;
    rationale: string;
    sourceConversationId?: string | null;
  },
): Promise<AgentSuggestionRow> {
  const [row] = await executor.insert(agentSuggestions).values(values).returning();
  if (!row) throw new Error("agent_suggestions insert returned no row");
  return row;
}

export async function markSuggestionReviewed(
  executor: DbExecutor,
  suggestionId: string,
  values: { status: string; reviewedBy: string },
): Promise<AgentSuggestionRow | undefined> {
  const [row] = await executor
    .update(agentSuggestions)
    .set({ ...values, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(agentSuggestions.id, suggestionId))
    .returning();
  return row;
}
