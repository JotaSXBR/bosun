"use server";

import { enqueueObserverAnalyze } from "@crm/automation";
import { DomainError } from "@crm/core";
import type { CreateAgentInput, UpdateAgentInput } from "@crm/core/agents";
import { createAgent, deleteAgentById, updateAgent } from "@crm/core/agents";
import type { CreateLlmCredentialInput, UpdateLlmCredentialInput } from "@crm/core/ai";
import { createLlmCredential, deleteLlmCredential, updateLlmCredential } from "@crm/core/ai";
import type { ProposeEntryInput, RenewEntryInput } from "@crm/core/brain";
import { archiveBrainEntry, renewBrainEntry } from "@crm/core/brain";
import type {
  CreateKnowledgeEntryInput,
  ProposeKnowledgeEntryInput,
  UpdateKnowledgeEntryInput,
} from "@crm/core/knowledge";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  updateKnowledgeEntry,
} from "@crm/core/knowledge";
import {
  approveSuggestion,
  proposeKnowledgeEntry,
  proposeMemoryEntry,
  rejectSuggestion,
} from "@crm/core/suggestions";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type AiActionResult = { ok: true } | { ok: false; error: string };

const AI_SETTINGS_PATH = "/app/settings/ai";
// Revisões/Conhecimento/Memória moved to the Inteligência module (IA spec §5).
const AI_MODULE_PATH = "/app/ai";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "ai" });
  return fallback;
}

// --- LLM credentials (BYOK) ---------------------------------------------------

export async function createLlmCredentialAction(
  input: CreateLlmCredentialInput,
): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await createLlmCredential(getDb(), ctx, input);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível salvar a credencial.") };
  }
}

export async function updateLlmCredentialAction(
  input: UpdateLlmCredentialInput,
): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await updateLlmCredential(getDb(), ctx, input);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível atualizar a credencial.") };
  }
}

export async function deleteLlmCredentialAction(credentialId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await deleteLlmCredential(getDb(), ctx, credentialId);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível remover a credencial.") };
  }
}

// --- Agents -------------------------------------------------------------------

export async function createAgentAction(input: CreateAgentInput): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await createAgent(getDb(), ctx, input);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar o agente.") };
  }
}

export async function updateAgentAction(input: UpdateAgentInput): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await updateAgent(getDb(), ctx, input);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível atualizar o agente.") };
  }
}

export async function deleteAgentAction(agentId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await deleteAgentById(getDb(), ctx, agentId);
    revalidatePath(AI_SETTINGS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível remover o agente.") };
  }
}

// --- Knowledge ----------------------------------------------------------------

export async function createKnowledgeEntryAction(
  input: CreateKnowledgeEntryInput,
): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await createKnowledgeEntry(getDb(), ctx, input);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar a entrada.") };
  }
}

export async function updateKnowledgeEntryAction(
  input: UpdateKnowledgeEntryInput,
): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await updateKnowledgeEntry(getDb(), ctx, input);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível atualizar a entrada.") };
  }
}

export async function deleteKnowledgeEntryAction(entryId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await deleteKnowledgeEntry(getDb(), ctx, entryId);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível remover a entrada.") };
  }
}

// --- Suggestions + observer ---------------------------------------------------

export async function approveSuggestionAction(suggestionId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await approveSuggestion(getDb(), ctx, suggestionId);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível aprovar a sugestão.") };
  }
}

export async function rejectSuggestionAction(suggestionId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await rejectSuggestion(getDb(), ctx, suggestionId);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível rejeitar a sugestão.") };
  }
}

/**
 * Manual observer trigger — enqueues analysis of the org's most recent
 * resolved conversation (the job picks it). No-op when the org has no
 * LLM credential configured.
 */
export async function analyzeNowAction(): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await enqueueObserverAnalyze({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      force: true,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível iniciar a análise.") };
  }
}

// --- Second brain (memória operacional) ---------------------------------------

/** Human-curated staging — lands in the suggestion inbox for peer review. */
export async function proposeMemoryEntryAction(input: ProposeEntryInput): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await proposeMemoryEntry(getDb(), ctx, input);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível propor a memória.") };
  }
}

/** "Ensinar a IA" — any member with messaging:write stages knowledge for review. */
export async function proposeKnowledgeEntryAction(
  input: ProposeKnowledgeEntryInput,
): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await proposeKnowledgeEntry(getDb(), ctx, input);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível propor o conhecimento.") };
  }
}

export async function renewBrainEntryAction(input: RenewEntryInput): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await renewBrainEntry(getDb(), ctx, input);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível renovar a memória.") };
  }
}

export async function archiveBrainEntryAction(entryId: string): Promise<AiActionResult> {
  const ctx = await requireTenantContext();
  try {
    await archiveBrainEntry(getDb(), ctx, entryId);
    revalidatePath(AI_MODULE_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível arquivar a memória.") };
  }
}
