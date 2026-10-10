import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

const { agentSuggestions, conversations, messages } = schema;

export const DRAFT_TARGET_TYPE = "draft";
export const NUDGE_TARGET_TYPE = "nudge";

/** Draft and nudge share the one-pending-card-per-conversation slot. */
export const THREAD_CARD_TARGET_TYPES = [DRAFT_TARGET_TYPE, NUDGE_TARGET_TYPE] as const;

/** Pending thread cards for one conversation (newest first). */
export async function listPendingThreadCards(
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
        inArray(agentSuggestions.targetType, [...THREAD_CARD_TARGET_TYPES]),
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
 * Regeneration supersedes: every still-pending thread card for the
 * conversation is retired before the new one lands — at most one pending
 * card lives per conversation (a fresh draft also replaces a nudge).
 */
export async function supersedePendingThreadCards(
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
        inArray(agentSuggestions.targetType, [...THREAD_CARD_TARGET_TYPES]),
        eq(agentSuggestions.sourceConversationId, conversationId),
        eq(agentSuggestions.status, "pending"),
      ),
    );
}

/** The conversation's most recent message — direction + timestamp (scan predicates). */
const LAST_MESSAGE_SQL = sql`(
  select m.direction, m.sent_at from ${messages} m
  where m.conversation_id = ${conversations.id}
  order by m.sent_at desc nulls last, m.created_at desc
  limit 1
)`;

const LAST_DIRECTION_SQL = sql`(select direction from ${LAST_MESSAGE_SQL} lm)`;
const LAST_SENT_AT_SQL = sql`(select sent_at from ${LAST_MESSAGE_SQL} lm)`;

/** Pending thread card exists for the conversation (either kind). */
const PENDING_CARD_SQL = sql`exists (
  select 1 from ${agentSuggestions} s
  where s.source_conversation_id = ${conversations.id}
    and s.target_type in ('draft', 'nudge')
    and s.status = 'pending'
)`;

export type NudgeCandidate = { id: string; idleSince: Date | null };

/**
 * Interval-scan predicate (docs/product/ai-agents.md): tickets open or
 * in-progress, assigned to a human, whose LAST message is inbound and
 * older than `idleMinutes`. Conversations with a pending thread card or
 * a card inside the cooldown window are skipped — the card already
 * prompts action and re-prompting is spam. The cooldown counts drafts
 * too: without it, an auto_draft org would re-enqueue a paid generation
 * right after the human rejected the previous one.
 */
export async function listNudgeCandidates(
  executor: DbExecutor,
  organizationId: string,
  opts: { idleMinutes: number; cooldownMinutes: number },
): Promise<NudgeCandidate[]> {
  const rows = await executor
    .select({
      id: conversations.id,
      idleSince: sql<Date | null>`${LAST_SENT_AT_SQL}`,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, organizationId),
        inArray(conversations.status, ["open", "in_progress"]),
        isNotNull(conversations.assigneeId),
        sql`${LAST_DIRECTION_SQL} = 'inbound'`,
        sql`${LAST_SENT_AT_SQL} < now() - make_interval(mins => ${opts.idleMinutes})`,
        sql`not ${PENDING_CARD_SQL}`,
        sql`not exists (
          select 1 from ${agentSuggestions} s
          where s.source_conversation_id = ${conversations.id}
            and s.target_type in ('draft', 'nudge')
            and s.created_at > now() - make_interval(mins => ${opts.cooldownMinutes})
        )`,
      ),
    );
  return rows;
}

/**
 * Scan cleanup: pending nudges whose predicate no longer holds — ticket
 * left the active set, unassigned, the human already replied (last
 * message outbound), a pending draft took the card slot, or the source
 * conversation is gone.
 */
export async function listStaleNudges(
  executor: DbExecutor,
  organizationId: string,
): Promise<{ id: string }[]> {
  return executor
    .select({ id: agentSuggestions.id })
    .from(agentSuggestions)
    .leftJoin(conversations, eq(conversations.id, agentSuggestions.sourceConversationId))
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.targetType, NUDGE_TARGET_TYPE),
        eq(agentSuggestions.status, "pending"),
        or(
          isNull(conversations.id),
          sql`${conversations.status} not in ('open', 'in_progress')`,
          isNull(conversations.assigneeId),
          sql`coalesce(${LAST_DIRECTION_SQL}, 'outbound') <> 'inbound'`,
          sql`exists (
            select 1 from ${agentSuggestions} s
            where s.source_conversation_id = ${conversations.id}
              and s.target_type = 'draft'
              and s.status = 'pending'
          )`,
        ),
      ),
    );
}

/** Marks stale nudges `superseded` — the scan's cleanup pass. */
export async function supersedeNudges(
  executor: DbExecutor,
  organizationId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  await executor
    .update(agentSuggestions)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(agentSuggestions.organizationId, organizationId),
        eq(agentSuggestions.targetType, NUDGE_TARGET_TYPE),
        eq(agentSuggestions.status, "pending"),
        inArray(agentSuggestions.id, ids),
      ),
    );
}
