"use server";

import { enqueueGenerateDraft } from "@crm/automation";
import { assertPermission, DomainError } from "@crm/core";
import { hasOrgLlmCredentials } from "@crm/core/ai";
import type { RequestDraftInput, ReviewDraftInput } from "@crm/core/drafts";
import { approveDraft, parseDraftRequest, rejectDraft, reviewDraftInput } from "@crm/core/drafts";
import { getDb, withTenant } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type DraftActionResult = { ok: true; id?: string } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "drafts" });
  return fallback;
}

/**
 * Composer buttons — validates, checks messaging:write, then enqueues the
 * drafter job. Generation is async: the card lands via SSE refresh. A
 * missing BYOK credential fails here, in the click — the job's silent
 * skip is for system paths, not for a user waiting on a card.
 */
export async function requestDraftAction(input: RequestDraftInput): Promise<DraftActionResult> {
  const ctx = await requireTenantContext();
  try {
    const parsed = parseDraftRequest(input);
    assertPermission(ctx, { messaging: ["write"] });
    if (parsed.mode === "improve" && !parsed.sourceText) {
      return { ok: false, error: "Escreva algo no composer para melhorar." };
    }
    const configured = await withTenant(getDb(), ctx.organizationId, (tx) =>
      hasOrgLlmCredentials(tx, ctx.organizationId),
    );
    if (!configured) {
      return {
        ok: false,
        error: "Configure uma credencial de IA em Configurações > IA antes de gerar sugestões.",
      };
    }
    const enqueued = await enqueueGenerateDraft({
      organizationId: ctx.organizationId,
      conversationId: parsed.conversationId,
      mode: parsed.mode,
      sourceText: parsed.mode === "improve" ? parsed.sourceText : undefined,
      requestedBy: ctx.userId,
    });
    if (enqueued.skipped) {
      return { ok: false, error: "A fila de tarefas não está ativa — tente novamente." };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível gerar a sugestão.") };
  }
}

export async function approveDraftAction(input: ReviewDraftInput): Promise<DraftActionResult> {
  const ctx = await requireTenantContext();
  try {
    const parsed = reviewDraftInput.parse(input);
    const row = await approveDraft(getDb(), ctx, parsed.suggestionId);
    revalidatePath("/app/inbox");
    return { ok: true, id: row.id };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível enviar a resposta.") };
  }
}

export async function rejectDraftAction(input: ReviewDraftInput): Promise<DraftActionResult> {
  const ctx = await requireTenantContext();
  try {
    const parsed = reviewDraftInput.parse(input);
    const row = await rejectDraft(getDb(), ctx, parsed.suggestionId);
    revalidatePath("/app/inbox");
    return { ok: true, id: row.id };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível descartar a sugestão.") };
  }
}
