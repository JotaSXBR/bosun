import type { ObserverInput, ObserverResult } from "@crm/ai";
import { analyzeConversation, resolveLanguageModel } from "@crm/ai";
import { listAgentRows, modelRefSchema } from "@crm/core/agents";
import { llmProviderSchema, recordUsageEvents, resolveOrgLlmCredentials } from "@crm/core/ai";
import { listCanonEntries, memoryProposalSchema } from "@crm/core/brain";
import { DRAFT_TARGET_TYPE, findOrCreateObserver } from "@crm/core/drafts";
import { listKnowledgeRows } from "@crm/core/knowledge";
import { getConversationRow, listConversations, listRecentMessages } from "@crm/core/messaging";
import { findSettings } from "@crm/core/organizations";
import {
  createSystemSuggestions,
  listPendingByTargetType,
  listPendingForConversation,
} from "@crm/core/suggestions";
import type { Database } from "@crm/db";
import { getDb, withTenant } from "@crm/db";
import { createLogger } from "@crm/observability";
import { z } from "zod";

import { keysFor } from "../llm-keys";

const logger = createLogger({ bindings: { component: "observer" } });

export const observerAnalyzePayload = z.object({
  organizationId: z.uuid(),
  /** Resolved conversation to analyze; absent → latest resolved (manual trigger). */
  conversationId: z.uuid().optional(),
  /** Who clicked "analyze now" — identity only, never trusted for auth. */
  actorUserId: z.uuid().optional(),
  /** Manual "analyze now" — bypasses the observer-mode gate (conscious click). */
  force: z.boolean().optional(),
});

export type ObserverAnalyzePayload = z.infer<typeof observerAnalyzePayload>;

/** Resolved-conversation transcripts are capped — long history is a cost knob. */
const TRANSCRIPT_LIMIT = 100;
const MANUAL_CANDIDATES = 3;

async function pickConversationId(
  db: Database,
  organizationId: string,
  conversationId: string | undefined,
): Promise<string | null> {
  if (conversationId) return conversationId;
  const resolved = await listConversations(db, organizationId, {
    view: "resolved",
    limit: MANUAL_CANDIDATES,
    userId: "",
  });
  for (const conv of resolved) {
    const pending = await withTenant(db, organizationId, (tx) =>
      listPendingForConversation(tx, organizationId, conv.id),
    );
    if (pending.length === 0) return conv.id;
  }
  return null;
}

export type ObserverAnalyzeDeps = {
  /** LLM call — injectable so tests don't hit a real provider. */
  analyze?: (input: ObserverInput) => Promise<ObserverResult>;
};

/**
 * AI observer v1 — passive analysis of a resolved conversation. Emits
 * pending `agent_suggestions` only: never sends a customer message, never
 * drafts a reply. Organizations without an LLM credential are silently
 * skipped (BYOK is opt-in). Retries re-use the pending-suggestion dedupe,
 * so a re-run can't duplicate suggestions for the same target.
 */
export async function observerAnalyzeHandler(
  payload: unknown,
  deps?: ObserverAnalyzeDeps,
): Promise<{
  analyzed: boolean;
  suggestions: number;
  skipped?: boolean;
}> {
  const parsed = observerAnalyzePayload.parse(payload);
  const db = getDb();
  const organizationId = parsed.organizationId;

  // Observer-mode gate (docs/product/ai-agents.md): post-resolve analysis
  // runs on `on_close` (and `realtime` when it ships); `interval` orgs get
  // nudges from observer-scan instead; `off` runs nothing. A manual
  // trigger (force) always runs — the click is a conscious spend.
  const mode = await withTenant(
    db,
    organizationId,
    async (tx) => (await findSettings(tx, organizationId))?.aiObserverMode ?? "on_close",
  );
  if (!parsed.force && mode !== "on_close" && mode !== "realtime") {
    return { analyzed: false, suggestions: 0, skipped: true };
  }

  const conversationId = await pickConversationId(db, organizationId, parsed.conversationId);
  if (!conversationId) return { analyzed: false, suggestions: 0, skipped: true };

  const prepared = await withTenant(db, organizationId, async (tx) => {
    const credentials = await resolveOrgLlmCredentials(tx, organizationId);
    if (credentials.length === 0) return null;
    const pending = (await listPendingForConversation(tx, organizationId, conversationId)).filter(
      // Drafts/nudges live on open threads — they must not block the
      // post-resolve analysis pass.
      (row) => row.targetType !== DRAFT_TARGET_TYPE,
    );
    if (pending.length > 0) return null;
    const agents = await listAgentRows(tx, organizationId);
    const knowledge = await listKnowledgeRows(tx, organizationId);
    const conversation = await getConversationRow(tx, conversationId);
    // Brain context: canon entries relevant to this conversation (org-wide +
    // its team/contact scope) + pending memory proposals for dedupe.
    const canon = await listCanonEntries(tx, organizationId, {
      teamId: conversation?.sectorId ?? undefined,
      contactId: conversation?.contactId,
      limit: 15,
    });
    const pendingMemory = await listPendingByTargetType(tx, organizationId, "memory");
    return {
      credentials,
      agents,
      knowledge,
      teamId: conversation?.sectorId ?? null,
      contactId: conversation?.contactId ?? null,
      brain: {
        canon: canon.map((e) => ({
          id: e.id,
          type: e.type,
          scope: e.scope,
          content: e.content,
          confidence: e.confidence,
        })),
        pendingContents: pendingMemory
          .map((row) => (row.payload as { content?: string }).content ?? "")
          .filter((c) => c.length > 0),
      },
    };
  });
  if (!prepared) {
    return { analyzed: false, suggestions: 0, skipped: true };
  }

  // The org's observer agent steers the run: its systemPrompt appends to
  // the base prompt and its modelRef overrides the credential's model when
  // the provider matches (a different provider's model can't use this key).
  const [observer, messages] = await Promise.all([
    findOrCreateObserver(db, organizationId),
    listRecentMessages(db, organizationId, conversationId, TRANSCRIPT_LIMIT),
  ]);
  const observerModelRef = (() => {
    const parsed_ = modelRefSchema.safeParse(observer.modelRef);
    return parsed_.success ? parsed_.data : null;
  })();
  const transcript = messages.map((m) => {
    const content = m.content as { text?: string; caption?: string; type?: string };
    return {
      direction: m.direction as "inbound" | "outbound",
      text: content.text ?? content.caption ?? `[${content.type ?? "media"}]`,
      private: m.private,
    };
  });
  const agents = prepared.agents.map((a) => ({
    id: a.id,
    name: a.name,
    specialty: a.specialty,
    status: a.status,
    systemPrompt: a.systemPrompt,
  }));
  const knowledge = prepared.knowledge
    .filter((k) => k.status === "active")
    .map((k) => ({ id: k.id, title: k.title }));

  let lastError: unknown;
  for (const cred of prepared.credentials) {
    const attempt = await runCredentialAttempt(
      {
        db,
        organizationId,
        conversationId,
        cred,
        teamId: prepared.teamId,
        contactId: prepared.contactId,
        observerModelRef,
        observerPersona: observer.systemPrompt,
      },
      { transcript, agents, knowledge, brain: prepared.brain, analyze: deps?.analyze },
    );
    if (attempt.ok) return { analyzed: true, suggestions: attempt.suggestions };
    lastError = attempt.error;
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

type Credential = {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  zdr: boolean;
};

/** One credential in the fallback chain — records usage on both outcomes. */
async function runCredentialAttempt(
  scope: {
    db: Database;
    organizationId: string;
    conversationId: string;
    cred: Credential;
    teamId: string | null;
    contactId: string | null;
    /** Observer agent's modelRef — overrides the credential model on provider match. */
    observerModelRef: { provider: string; modelId: string } | null;
    observerPersona: string;
  },
  input: Omit<ObserverInput, "model" | "observerPersona"> & Pick<ObserverAnalyzeDeps, "analyze">,
): Promise<{ ok: true; suggestions: number } | { ok: false; error: unknown }> {
  const {
    db,
    organizationId,
    conversationId,
    cred,
    teamId,
    contactId,
    observerModelRef,
    observerPersona,
  } = scope;
  const provider = llmProviderSchema.parse(cred.provider);
  const modelId = observerModelRef?.provider === provider ? observerModelRef.modelId : cred.model;
  const startedAt = Date.now();
  const record = (status: "ok" | "error", tokensIn = 0, tokensOut = 0) =>
    withTenant(db, organizationId, (tx) =>
      recordUsageEvents(tx, organizationId, [
        {
          credentialId: cred.id,
          callKind: "observer",
          provider: cred.provider,
          model: modelId,
          tokensIn,
          tokensOut,
          latencyMs: Date.now() - startedAt,
          status,
        },
      ]),
    );
  try {
    const model = resolveLanguageModel(
      {
        provider,
        modelId,
        routing: { zdr: cred.zdr, sessionId: conversationId },
      },
      keysFor(cred),
    );
    const { transcript, agents, knowledge, brain, analyze } = input;
    const result = await (analyze ?? analyzeConversation)({
      model,
      transcript,
      agents,
      knowledge,
      brain,
      observerPersona,
    });
    await record("ok", result.tokensIn, result.tokensOut);
    const created = await createSystemSuggestions(db, organizationId, [
      ...result.suggestions.map((s) => ({
        ...s,
        targetId: s.targetId ?? null,
        sourceConversationId: conversationId,
      })),
      ...memorySuggestionInputs(result, { conversationId, teamId, contactId }, organizationId),
    ]);
    return { ok: true, suggestions: created.length };
  } catch (error) {
    logger.warn("observer credential attempt failed", {
      organizationId,
      provider: cred.provider,
      model: cred.model,
      error: error instanceof Error ? error.message : String(error),
    });
    await record("error").catch((usageError: unknown) =>
      logger.warn("observer usage record failed", {
        organizationId,
        error: usageError instanceof Error ? usageError.message : String(usageError),
      }),
    );
    return { ok: false, error };
  }
}

/**
 * Memory proposals → suggestion inputs. Scope refs come from the
 * conversation (never from the model): team scope binds `sectorId`,
 * contact scope binds `contactId`. Proposals that can't satisfy their
 * scope (e.g. team on a teamless conversation) or carry `low` confidence
 * are dropped — review-inbox hygiene beats recall here.
 */
function memorySuggestionInputs(
  result: ObserverResult,
  refs: { conversationId: string; teamId: string | null; contactId: string | null },
  organizationId: string,
): Array<{
  targetType: "memory";
  payload: Record<string, unknown>;
  rationale: string;
  sourceConversationId: string;
}> {
  return result.memories
    .filter((m) => m.confidence !== "low")
    .flatMap((m) => {
      const candidate = memoryProposalSchema.safeParse({
        type: m.type,
        scope: m.scope,
        teamId: m.scope === "team" ? refs.teamId : null,
        contactId: m.scope === "contact" ? refs.contactId : null,
        content: m.content,
        confidence: m.confidence,
        staleAfterDays: m.staleAfterDays,
        supersedes: m.supersedes ?? null,
        sourceConversationIds: [refs.conversationId],
      });
      if (!candidate.success) {
        logger.warn("observer memory proposal dropped", {
          organizationId,
          conversationId: refs.conversationId,
          scope: m.scope,
          reason: candidate.error.issues[0]?.message ?? "invalid payload",
        });
        return [];
      }
      return [
        {
          targetType: "memory" as const,
          payload: candidate.data,
          rationale: m.rationale,
          sourceConversationId: refs.conversationId,
        },
      ];
    });
}
