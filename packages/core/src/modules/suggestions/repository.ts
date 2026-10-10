import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, desc, eq, inArray } from "drizzle-orm";

const { agentSuggestions, contacts, teams } = schema;

export type AgentSuggestionRow = typeof agentSuggestions.$inferSelect;

export async function listSuggestions(
  executor: DbExecutor,
  organizationId: string,
  filter: { status?: string; limit: number; targetTypes?: string[] },
): Promise<AgentSuggestionRow[]> {
  return executor
    .select()
    .from(agentSuggestions)
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        filter.status ? eq(agentSuggestions.status, filter.status) : undefined,
        filter.targetTypes ? inArray(agentSuggestions.targetType, filter.targetTypes) : undefined,
      ),
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

/** Pending suggestions of one target type — observer dedupe context. */
export async function listPendingByTargetType(
  executor: DbExecutor,
  organizationId: string,
  targetType: string,
): Promise<AgentSuggestionRow[]> {
  return executor
    .select()
    .from(agentSuggestions)
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.targetType, targetType),
        eq(agentSuggestions.status, "pending"),
      ),
    )
    .orderBy(desc(agentSuggestions.createdAt))
    .limit(200);
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
    proposedBy?: string | null;
  },
): Promise<AgentSuggestionRow> {
  const [row] = await executor.insert(agentSuggestions).values(values).returning();
  if (!row) throw new Error("agent_suggestions insert returned no row");
  return row;
}

/** Scope references for memory proposals must exist inside the org. */
export async function scopeRefsExist(
  executor: DbExecutor,
  organizationId: string,
  refs: { teamId?: string | null; contactId?: string | null },
): Promise<boolean> {
  if (refs.teamId) {
    const [row] = await executor
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, refs.teamId), eq(teams.organizationId, organizationId)))
      .limit(1);
    if (!row) return false;
  }
  if (refs.contactId) {
    const [row] = await executor
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, refs.contactId), eq(contacts.organizationId, organizationId)))
      .limit(1);
    if (!row) return false;
  }
  return true;
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
