import type { ChannelProvider } from "@crm/channels";
import type { Database } from "@crm/db";
import { emitDomainEvent, withTenant } from "@crm/db";
import { captureException } from "@crm/observability";
import type { z } from "zod";

import { DomainError, NotFoundError } from "../../errors";
import { isUniqueViolation } from "../../lib/pg-error";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { findAgentByKind, insertAgent, insertAgentOnce } from "../agents";
import { recordAuditEvent } from "../audit";
import { sendOutboundMessage } from "../messaging";
import type { AgentSuggestionRow } from "../suggestions";
import { findSuggestionById, insertSuggestion, markSuggestionReviewed } from "../suggestions";
import {
  claimPendingDraft,
  DRAFT_TARGET_TYPE,
  listPendingDraftsForConversation,
  releaseDraftClaim,
  supersedePendingDrafts,
} from "./repository";
import type { DraftPayload } from "./schemas";
import { draftPayloadSchema, requestDraftInput } from "./schemas";

/** Audit is post-commit best-effort — a logging failure must not fail the mutation. */
function audit(db: Database, ctx: TenantContext, action: string, suggestionId: string): void {
  recordAuditEvent(db, ctx, {
    action,
    targetType: "agent_suggestion",
    targetId: suggestionId,
    metadata: { suggestionId, targetType: DRAFT_TARGET_TYPE },
  }).catch((error: unknown) => captureException(error, { module: "drafts", action }));
}

function assertDraftRow(suggestion: AgentSuggestionRow | null): AgentSuggestionRow {
  if (suggestion?.targetType !== DRAFT_TARGET_TYPE) {
    throw new NotFoundError("Draft", suggestion?.id ?? "?");
  }
  return suggestion;
}

/** Post-claim read for an approve that lost the pending-slot race. */
async function reviewedDraftState(
  db: Database,
  ctx: TenantContext,
  suggestionId: string,
): Promise<AgentSuggestionRow> {
  const current = assertDraftRow(
    await withTenant(db, ctx.organizationId, (tx) =>
      findSuggestionById(tx, ctx.organizationId, suggestionId),
    ),
  );
  if (current.status === "approved") return current;
  throw new DomainError("DRAFT_ALREADY_REVIEWED", current.status);
}

/** Requires messaging:write — viewers never see drafts. */
export async function listDrafts(
  db: Database,
  ctx: TenantContext,
  conversationId: string,
): Promise<AgentSuggestionRow[]> {
  assertPermission(ctx, { messaging: ["write"] });
  return withTenant(db, ctx.organizationId, (tx) =>
    listPendingDraftsForConversation(tx, ctx.organizationId, conversationId),
  );
}

/**
 * System path — the generate-draft job calls this after the LLM run.
 * Supersedes any pending draft for the conversation, then inserts the new
 * one and emits the SSE event the inbox listens to.
 */
export async function createDraftSuggestion(
  db: Database,
  organizationId: string,
  input: {
    conversationId: string;
    payload: DraftPayload;
    rationale: string;
    /** Who asked for the generation — null means a system enqueue. */
    proposedBy?: string | null;
  },
): Promise<AgentSuggestionRow> {
  const payload = draftPayloadSchema.parse(input.payload);
  try {
    return await withTenant(db, organizationId, async (tx) => {
      await supersedePendingDrafts(tx, organizationId, input.conversationId);
      const row = await insertSuggestion(tx, {
        organizationId,
        targetType: DRAFT_TARGET_TYPE,
        payload,
        rationale: input.rationale,
        sourceConversationId: input.conversationId,
        proposedBy: input.proposedBy ?? null,
      });
      await emitDomainEvent(tx, {
        type: "agent_suggestion.created",
        organizationId,
        suggestionId: row.id,
        conversationId: input.conversationId,
        targetType: DRAFT_TARGET_TYPE,
      });
      return row;
    });
  } catch (error) {
    // Concurrent generation won the pending-slot race — return its row
    // instead of surfacing a constraint error to the caller.
    if (!isUniqueViolation(error)) throw error;
    const [existing] = await withTenant(db, organizationId, (tx) =>
      listPendingDraftsForConversation(tx, organizationId, input.conversationId),
    );
    if (!existing) throw error;
    return existing;
  }
}

/**
 * Requires messaging:write. Approve = send: the draft body goes out through
 * the normal outbound path (provider call, ticket → waiting_customer), then
 * the suggestion is marked reviewed. Send failure leaves it pending.
 */
export async function approveDraft(
  db: Database,
  ctx: TenantContext,
  suggestionId: string,
  deps?: { provider?: ChannelProvider },
): Promise<AgentSuggestionRow> {
  assertPermission(ctx, { messaging: ["write"] });
  const suggestion = assertDraftRow(
    await withTenant(db, ctx.organizationId, (tx) =>
      findSuggestionById(tx, ctx.organizationId, suggestionId),
    ),
  );
  if (suggestion.status === "approved") return suggestion;
  if (suggestion.status !== "pending") {
    throw new DomainError("DRAFT_ALREADY_REVIEWED", suggestion.status);
  }
  const { body } = draftPayloadSchema.parse(suggestion.payload);
  const conversationId = suggestion.sourceConversationId;
  if (!conversationId) {
    throw new DomainError("DRAFT_NO_CONVERSATION", "draft has no source conversation");
  }
  // Atomic claim — a concurrent approve that lands after this update gets
  // zero rows back, so the same draft can never be sent twice.
  const claimed = await withTenant(db, ctx.organizationId, (tx) =>
    claimPendingDraft(tx, suggestionId, ctx.userId),
  );
  // Another approve may have won the race between our status check and
  // the claim — return its outcome instead of sending again.
  if (!claimed) return reviewedDraftState(db, ctx, suggestionId);
  try {
    // Sends outside the review tx — provider latency must not hold row locks.
    await sendOutboundMessage(db, ctx, { conversationId, text: body }, deps);
  } catch (error) {
    // Release the claim so a failed send leaves the draft pending.
    await withTenant(db, ctx.organizationId, (tx) => releaseDraftClaim(tx, suggestionId)).catch(
      (releaseError: unknown) =>
        captureException(releaseError, { module: "drafts", action: "releaseDraftClaim" }),
    );
    throw error;
  }
  await withTenant(db, ctx.organizationId, (tx) =>
    emitDomainEvent(tx, {
      type: "agent_suggestion.reviewed",
      organizationId: ctx.organizationId,
      suggestionId,
      conversationId,
      targetType: DRAFT_TARGET_TYPE,
    }),
  );
  audit(db, ctx, "agent_draft.approved", suggestionId);
  return claimed;
}

/** Requires messaging:write. Reject just dismisses the card. */
export async function rejectDraft(
  db: Database,
  ctx: TenantContext,
  suggestionId: string,
): Promise<AgentSuggestionRow> {
  assertPermission(ctx, { messaging: ["write"] });
  const reviewed = await withTenant(db, ctx.organizationId, async (tx) => {
    const suggestion = assertDraftRow(
      await findSuggestionById(tx, ctx.organizationId, suggestionId),
    );
    if (suggestion.status === "rejected") return suggestion;
    if (suggestion.status !== "pending") {
      throw new DomainError("DRAFT_ALREADY_REVIEWED", suggestion.status);
    }
    const row = await markSuggestionReviewed(tx, suggestionId, {
      status: "rejected",
      reviewedBy: ctx.userId,
    });
    if (!row) throw new NotFoundError("Draft", suggestionId);
    await emitDomainEvent(tx, {
      type: "agent_suggestion.reviewed",
      organizationId: ctx.organizationId,
      suggestionId,
      conversationId: suggestion.sourceConversationId ?? undefined,
      targetType: DRAFT_TARGET_TYPE,
    });
    return row;
  });
  audit(db, ctx, "agent_draft.rejected", suggestionId);
  return reviewed;
}

/**
 * The org's drafter — dedicated `kind='drafter'` agent row, lazily created
 * on first use with a sane default persona; editable afterwards through
 * the regular agents settings UI (`ai:manage`).
 */
export async function findOrCreateDrafter(db: Database, organizationId: string) {
  return withTenant(db, organizationId, async (tx) => {
    const existing = await findAgentByKind(tx, organizationId, "drafter");
    if (existing) return existing;
    const values = {
      organizationId,
      name: "Drafter",
      specialty: "Sugestões de resposta para revisão humana",
      status: "active",
      kind: "drafter",
      systemPrompt:
        "Você escreve rascunhos de resposta no tom da empresa: cordial, direto, " +
        "sem jargão técnico com o cliente. Trate o cliente por 'você'.",
      toolsAllowlist: [],
    };
    const created = await insertAgentOnce(tx, values);
    if (created) return created;
    // Lost the lazy-create race on agents_org_kind_unique — the winner's
    // row is committed and visible to this fresh read.
    const winner = await findAgentByKind(tx, organizationId, "drafter");
    if (winner) return winner;
    // A different unique constraint fired (e.g. agents_org_name_idx on a
    // user-created "Drafter" agent) — surface the real violation.
    return insertAgent(tx, values);
  });
}

/** Validates a composer-side draft request (enqueue boundary). */
export function parseDraftRequest(input: unknown): z.output<typeof requestDraftInput> {
  return requestDraftInput.parse(input);
}
