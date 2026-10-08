import type { LanguageModel } from "ai";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Structured output the observer may emit — only configuration changes,
 * never message drafts. `targetId` null/absent proposes creating a new
 * entity; payload field names match the create schemas in @crm/core
 * (`createAgentInput` / `createKnowledgeEntryInput`) and are re-validated
 * server-side before anything applies.
 */
export const observerSuggestionSchema = z.object({
  targetType: z.enum(["agent", "knowledge_entry"]),
  targetId: z.string().nullish(),
  payload: z.record(z.string(), z.unknown()),
  rationale: z.string().min(1).max(2000),
});
export const observerResultSchema = z.object({
  suggestions: z.array(observerSuggestionSchema).max(5),
});
export type ObserverSuggestion = z.infer<typeof observerSuggestionSchema>;

export type ObserverTranscriptEntry = {
  direction: "inbound" | "outbound";
  text: string;
  /** Private agent notes stay visible to the observer but flagged. */
  private?: boolean;
};

export type ObserverAgentSummary = {
  id: string;
  name: string;
  specialty: string | null;
  status: string;
  systemPrompt: string;
};

export type ObserverInput = {
  model: LanguageModel;
  transcript: ObserverTranscriptEntry[];
  agents: ObserverAgentSummary[];
  knowledge: Array<{ id: string; title: string }>;
};

export type ObserverResult = {
  suggestions: ObserverSuggestion[];
  tokensIn: number;
  tokensOut: number;
};

const SYSTEM_PROMPT = `Você é o observador de qualidade do Bosun. Analise a conversa resolvida e a configuração atual de agentes e conhecimento da organização. Proponha melhorias concretas de configuração — nunca rascunhos de resposta ao cliente e nunca mensagens.

Regras:
- targetType "agent": use targetId = id de um agente existente e payload com os campos a alterar (name, specialty, status, modelRef, systemPrompt, businessRules, toolsAllowlist, availabilityWindow, memoryTokenCap, toolExecutionLimit, signatureLine); ou omita targetId para propor um NOVO agente (payload exige name e systemPrompt).
- targetType "knowledge_entry": use targetId = id de uma entrada existente e payload com os campos a alterar (title, content, status); ou omita targetId para uma NOVA entrada (payload exige title e content).
- rationale: 1-2 frases em português citando a evidência na conversa.
- Máximo 5 sugestões; se a conversa não sugere melhoria, retorne uma lista vazia.
- Mensagens marcadas como [nota interna] são privadas — use como contexto, nunca como conteúdo sugerido ao cliente.`;

/**
 * One observer pass over a resolved conversation. Pure function of
 * (model, data) — the caller supplies the resolved model and the
 * tenant-scoped reads; nothing here touches the DB or sends messages.
 */
export async function analyzeConversation(input: ObserverInput): Promise<ObserverResult> {
  const transcript = input.transcript
    .map(
      (m) =>
        `${m.private ? "[nota interna] " : ""}${m.direction === "inbound" ? "Cliente" : "Agente"}: ${m.text}`,
    )
    .join("\n");

  const agents = input.agents
    .map(
      (a) =>
        `- id=${a.id} name="${a.name}" status=${a.status} specialty=${a.specialty ?? "-"} systemPrompt="${a.systemPrompt.slice(0, 500)}"`,
    )
    .join("\n");

  const knowledge = input.knowledge.map((k) => `- id=${k.id} title="${k.title}"`).join("\n");

  const result = await generateObject({
    model: input.model,
    schema: observerResultSchema,
    system: SYSTEM_PROMPT,
    prompt: `## Conversa resolvida\n${transcript || "(vazia)"}\n\n## Agentes atuais\n${agents || "(nenhum)"}\n\n## Conhecimento atual\n${knowledge || "(nenhum)"}`,
  });

  return {
    suggestions: result.object.suggestions,
    tokensIn: result.usage.inputTokens ?? 0,
    tokensOut: result.usage.outputTokens ?? 0,
  };
}
