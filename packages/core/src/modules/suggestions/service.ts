import type { Database, DbExecutor } from "@crm/db";
import { emitDomainEvent, withTenant } from "@crm/db";
import { captureException } from "@crm/observability";

import { DomainError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { createAgentInput, findAgentById, insertAgent, updateAgentRow } from "../agents";
import { recordAuditEvent } from "../audit";
import { createKnowledgeEntryInput, findEntryById, insertEntry, updateEntry } from "../knowledge";
import type { AgentSuggestionRow } from "./repository";
import {
  findSuggestionById,
  insertSuggestion,
  listPendingForConversation,
  listSuggestions as repoListSuggestions,
  markSuggestionReviewed,
} from "./repository";
import type { CreateSuggestionInput, ListSuggestionsInput } from "./schemas";
import { createSuggestionInput, listSuggestionsInput } from "./schemas";

/** Audit is post-commit best-effort — a logging failure must not fail the mutation. */
function audit(db: Database, ctx: TenantContext, action: string, suggestionId: string): void {
  recordAuditEvent(db, ctx, {
    action,
    targetType: "agent_suggestion",
    targetId: suggestionId,
    metadata: { suggestionId },
  }).catch((error: unknown) => captureException(error, { module: "suggestions", action }));
}

/** Requires ai:read. */
export async function listAgentSuggestions(
  db: Database,
  ctx: TenantContext,
  input?: ListSuggestionsInput,
): Promise<AgentSuggestionRow[]> {
  assertPermission(ctx, { ai: ["read"] });
  const parsed = listSuggestionsInput.parse(input ?? {});
  return withTenant(db, ctx.organizationId, (tx) =>
    repoListSuggestions(tx, ctx.organizationId, parsed),
  );
}

/**
 * System path — called by the observer job, which authenticates itself
 * (tenant identity rebuilt from the DB) rather than a user. Tenant-scoped
 * write + SSE notification commit atomically.
 */
export async function createSystemSuggestion(
  db: Database,
  organizationId: string,
  input: CreateSuggestionInput,
): Promise<AgentSuggestionRow> {
  const parsed = createSuggestionInput.parse(input);
  return withTenant(db, organizationId, async (tx) => {
    const row = await insertSuggestion(tx, { organizationId, ...parsed });
    await emitDomainEvent(tx, {
      type: "agent_suggestion.created",
      organizationId,
      suggestionId: row.id,
    });
    return row;
  });
}

/**
 * Observer batch insert — one transaction, one SSE event per row.
 * Idempotent: an input whose (targetType, targetId) already has a pending
 * suggestion from the same source conversation is skipped, so job retries
 * and repeated analyze triggers can't pile up duplicates.
 */
export async function createSystemSuggestions(
  db: Database,
  organizationId: string,
  inputs: CreateSuggestionInput[],
): Promise<AgentSuggestionRow[]> {
  if (inputs.length === 0) return [];
  const parsed = inputs.map((input) => createSuggestionInput.parse(input));
  return withTenant(db, organizationId, async (tx) => {
    const conversationIds = [
      ...new Set(
        parsed
          .map((p) => p.sourceConversationId)
          .filter((id): id is string => typeof id === "string"),
      ),
    ];
    const existing = new Set(
      (
        await Promise.all(
          conversationIds.map((id) => listPendingForConversation(tx, organizationId, id)),
        )
      )
        .flat()
        .map((row) => `${row.targetType}:${row.targetId ?? ""}`),
    );
    const created: AgentSuggestionRow[] = [];
    for (const input of parsed) {
      if (
        input.sourceConversationId &&
        existing.has(`${input.targetType}:${input.targetId ?? ""}`)
      ) {
        continue;
      }
      const row = await insertSuggestion(tx, { organizationId, ...input });
      created.push(row);
      await emitDomainEvent(tx, {
        type: "agent_suggestion.created",
        organizationId,
        suggestionId: row.id,
      });
    }
    return created;
  });
}

async function applyAgentPayload(
  executor: DbExecutor,
  organizationId: string,
  targetId: string | null,
  payload: unknown,
): Promise<void> {
  if (targetId) {
    const existing = await findAgentById(executor, organizationId, targetId);
    if (!existing) throw new NotFoundError("Agent", targetId);
    await updateAgentRow(executor, existing.id, createAgentInput.partial().parse(payload));
  } else {
    await insertAgent(executor, { organizationId, ...createAgentInput.parse(payload) });
  }
}

async function applyKnowledgePayload(
  executor: DbExecutor,
  organizationId: string,
  targetId: string | null,
  payload: unknown,
): Promise<void> {
  if (targetId) {
    const existing = await findEntryById(executor, organizationId, targetId);
    if (!existing) throw new NotFoundError("KnowledgeEntry", targetId);
    await updateEntry(executor, existing.id, createKnowledgeEntryInput.partial().parse(payload));
  } else {
    await insertEntry(executor, {
      organizationId,
      ...createKnowledgeEntryInput.parse(payload),
      source: "suggestion",
    });
  }
}

/**
 * Applies the payload diff to the target entity inside the caller's
 * tenant-scoped transaction. `targetId` null means the suggestion creates
 * a new entity (payload must satisfy the full create schema).
 */
async function applyPayload(executor: DbExecutor, suggestion: AgentSuggestionRow): Promise<void> {
  const targetId = suggestion.targetId ?? null;
  try {
    if (suggestion.targetType === "agent") {
      await applyAgentPayload(executor, suggestion.organizationId, targetId, suggestion.payload);
    } else if (suggestion.targetType === "knowledge_entry") {
      await applyKnowledgePayload(
        executor,
        suggestion.organizationId,
        targetId,
        suggestion.payload,
      );
    } else {
      throw new DomainError("SUGGESTION_TARGET_UNSUPPORTED", suggestion.targetType);
    }
  } catch (error) {
    const pg = error as { code?: string };
    if (pg.code === "23505") {
      throw new DomainError(
        "SUGGESTION_APPLY_CONFLICT",
        "Suggestion payload conflicts with an existing record",
      );
    }
    throw error;
  }
}

/** Requires ai:manage. Idempotent: re-approving returns the row unchanged. */
export async function approveSuggestion(
  db: Database,
  ctx: TenantContext,
  suggestionId: string,
): Promise<AgentSuggestionRow> {
  assertPermission(ctx, { ai: ["manage"] });
  const reviewed = await withTenant(db, ctx.organizationId, async (tx) => {
    const suggestion = await findSuggestionById(tx, ctx.organizationId, suggestionId);
    if (!suggestion) throw new NotFoundError("AgentSuggestion", suggestionId);
    if (suggestion.status === "approved") return suggestion;
    if (suggestion.status !== "pending") {
      throw new DomainError("SUGGESTION_ALREADY_REVIEWED", suggestion.status);
    }
    await applyPayload(tx, suggestion);
    const row = await markSuggestionReviewed(tx, suggestionId, {
      status: "approved",
      reviewedBy: ctx.userId,
    });
    if (!row) throw new NotFoundError("AgentSuggestion", suggestionId);
    await emitDomainEvent(tx, {
      type: "agent_suggestion.reviewed",
      organizationId: ctx.organizationId,
      suggestionId,
    });
    return row;
  });
  audit(db, ctx, "agent_suggestion.approved", suggestionId);
  return reviewed;
}

/** Requires ai:manage. Idempotent: re-rejecting returns the row unchanged. */
export async function rejectSuggestion(
  db: Database,
  ctx: TenantContext,
  suggestionId: string,
): Promise<AgentSuggestionRow> {
  assertPermission(ctx, { ai: ["manage"] });
  const reviewed = await withTenant(db, ctx.organizationId, async (tx) => {
    const suggestion = await findSuggestionById(tx, ctx.organizationId, suggestionId);
    if (!suggestion) throw new NotFoundError("AgentSuggestion", suggestionId);
    if (suggestion.status === "rejected") return suggestion;
    if (suggestion.status !== "pending") {
      throw new DomainError("SUGGESTION_ALREADY_REVIEWED", suggestion.status);
    }
    const row = await markSuggestionReviewed(tx, suggestionId, {
      status: "rejected",
      reviewedBy: ctx.userId,
    });
    if (!row) throw new NotFoundError("AgentSuggestion", suggestionId);
    await emitDomainEvent(tx, {
      type: "agent_suggestion.reviewed",
      organizationId: ctx.organizationId,
      suggestionId,
    });
    return row;
  });
  audit(db, ctx, "agent_suggestion.rejected", suggestionId);
  return reviewed;
}
