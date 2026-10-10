import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, desc, eq } from "drizzle-orm";

const { agentSuggestions } = schema;

export const DRAFT_TARGET_TYPE = "draft";

/** Pending draft suggestions for one conversation (newest first). */
export async function listPendingDraftsForConversation(
  executor: DbExecutor,
  organizationId: string,
  conversationId: string,
) {
  return executor
    .select()
    .from(agentSuggestions)
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.targetType, DRAFT_TARGET_TYPE),
        eq(agentSuggestions.sourceConversationId, conversationId),
        eq(agentSuggestions.status, "pending"),
      ),
    )
    .orderBy(desc(agentSuggestions.createdAt));
}

/**
 * Atomically flips a pending draft to approved — returns undefined when
 * another transaction already reviewed or claimed it. This is the guard
 * that makes "Aprovar e enviar" send-once under concurrent clicks.
 */
export async function claimPendingDraft(
  executor: DbExecutor,
  suggestionId: string,
  reviewedBy: string,
) {
  const [row] = await executor
    .update(agentSuggestions)
    .set({
      status: "approved",
      reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(agentSuggestions.id, suggestionId), eq(agentSuggestions.status, "pending")))
    .returning();
  return row;
}

/** Releases an approve claim after a failed send — the card goes back to pending. */
export async function releaseDraftClaim(executor: DbExecutor, suggestionId: string): Promise<void> {
  await executor
    .update(agentSuggestions)
    .set({ status: "pending", reviewedBy: null, reviewedAt: null, updatedAt: new Date() })
    .where(and(eq(agentSuggestions.id, suggestionId), eq(agentSuggestions.status, "approved")));
}

/**
 * Regeneration supersedes: every still-pending draft for the conversation
 * is retired before the new one lands — at most one pending draft lives
 * per conversation.
 */
export async function supersedePendingDrafts(
  executor: DbExecutor,
  organizationId: string,
  conversationId: string,
): Promise<void> {
  await executor
    .update(agentSuggestions)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.targetType, DRAFT_TARGET_TYPE),
        eq(agentSuggestions.sourceConversationId, conversationId),
        eq(agentSuggestions.status, "pending"),
      ),
    );
}
