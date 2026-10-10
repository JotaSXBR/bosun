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
/**
 * A proposed second-brain memory entry — internal operational learning,
 * never customer-facing content. Stages as an `agent_suggestions` row with
 * `target_type = 'memory'`; a canon `memory_entries` row only exists after
 * human approval. `supersedes` points at a canon entry id (shown in
 * context) when the new fact replaces it.
 */
export const observerMemorySchema = z.object({
  type: z.enum([
    "pattern",
    "procedure",
    "faq_gap",
    "decision",
    "preference",
    "escalation",
    "persona",
    "metric",
  ]),
  scope: z.enum(["org", "team", "contact"]).default("org"),
  content: z.string().min(1).max(2000),
  confidence: z.enum(["low", "medium", "high"]),
  staleAfterDays: z.number().int().min(1).max(730).default(90),
  supersedes: z.string().nullish(),
  rationale: z.string().min(1).max(2000),
});
export type ObserverMemory = z.infer<typeof observerMemorySchema>;

export const observerResultSchema = z.object({
  suggestions: z.array(observerSuggestionSchema).max(5),
  memories: z.array(observerMemorySchema).max(3).default([]),
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

/**
 * Second-brain context — canon entries the org already trusts (the only
 * ids `supersedes` may reference) and contents of pending proposals, so
 * the model doesn't re-propose what a human is already reviewing.
 */
export type ObserverBrainContext = {
  canon: Array<{
    id: string;
    type: string;
    scope: string;
    content: string;
    confidence: string;
  }>;
  pendingContents: string[];
};

export type ObserverInput = {
  model: LanguageModel;
  transcript: ObserverTranscriptEntry[];
  agents: ObserverAgentSummary[];
  knowledge: Array<{ id: string; title: string }>;
  brain?: ObserverBrainContext;
  /** Org's `kind='observer'` agent prompt — appended to the system prompt. */
  observerPersona?: string;
};

export type ObserverResult = {
  suggestions: ObserverSuggestion[];
  memories: ObserverMemory[];
  tokensIn: number;
  tokensOut: number;
};

const SYSTEM_PROMPT = `Você é o observador de qualidade do Bosun. Analise a conversa resolvida e a configuração atual de agentes e conhecimento da organização. Proponha melhorias concretas de configuração — nunca rascunhos de resposta ao cliente e nunca mensagens.

Regras:
- targetType "agent": use targetId = id de um agente existente e payload com os campos a alterar (name, specialty, status, modelRef, systemPrompt, businessRules, toolsAllowlist, availabilityWindow, memoryTokenCap, toolExecutionLimit, signatureLine); ou omita targetId para propor um NOVO agente (payload exige name e systemPrompt).
- targetType "knowledge_entry": use targetId = id de uma entrada existente e payload com os campos a alterar (title, content, status); ou omita targetId para uma NOVA entrada (payload exige title e content).
- rationale: 1-2 frases em português citando a evidência na conversa.
- Máximo 5 sugestões; se a conversa não sugere melhoria, retorne uma lista vazia.
- Mensagens marcadas como [nota interna] são privadas — use como contexto, nunca como conteúdo sugerido ao cliente.

Memórias (campo "memories") — aprendizado operacional interno da organização, distinto de knowledge_entry (que é conteúdo para o cliente):
- Proponha apenas aprendizados com evidência real na conversa: padrões de atendimento, procedimentos, decisões, preferências, regras de escalação, persona, métricas conhecidas ou lacunas de FAQ.
- NUNCA inclua dados pessoais identificáveis (nomes, telefones, documentos, e-mails). scope "contact" descreve COMO atender aquele contato — nunca fatos pessoais sobre ele.
- Não reproponha o que já está na memória canônica ou nas propostas pendentes listadas. Quando um fato novo SUBSTITUI uma entrada canônica, use "supersedes" com o id dela.
- confidence deve refletir a generalização: "high" só com evidência forte/repetida; evite "low" — memórias fracas viram ruído de revisão.
- staleAfterDays: quanto tempo a informação permanece confiável sem re-verificação (padrão 90).
- Máximo 3 memórias por análise.`;

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

  const brain = input.brain
    ? `\n\n## Memória operacional canônica\n${
        input.brain.canon
          .map(
            (e) =>
              `- id=${e.id} type=${e.type} scope=${e.scope} confidence=${e.confidence} "${e.content}"`,
          )
          .join("\n") || "(vazia)"
      }\n\n## Propostas de memória pendentes (não repropor)\n${
        input.brain.pendingContents.map((c) => `- "${c}"`).join("\n") || "(nenhuma)"
      }`
    : "";

  const persona = input.observerPersona?.trim();
  const result = await generateObject({
    model: input.model,
    schema: observerResultSchema,
    system: persona
      ? `${SYSTEM_PROMPT}\n\nPersona do observador desta organização:\n${persona}`
      : SYSTEM_PROMPT,
    prompt: `## Conversa resolvida\n${transcript || "(vazia)"}\n\n## Agentes atuais\n${agents || "(nenhum)"}\n\n## Conhecimento atual\n${knowledge || "(nenhum)"}${brain}`,
  });

  return {
    suggestions: result.object.suggestions,
    memories: result.object.memories,
    tokensIn: result.usage.inputTokens ?? 0,
    tokensOut: result.usage.outputTokens ?? 0,
  };
}
