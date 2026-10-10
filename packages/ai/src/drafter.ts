import type { LanguageModel } from "ai";
import { generateObject } from "ai";
import { z } from "zod";

import type { ObserverBrainContext, ObserverTranscriptEntry } from "./observer";

/**
 * The drafter's structured output — a customer-facing reply proposal plus
 * a short rationale for the human reviewer. It never sends anything;
 * the row lands as a pending `agent_suggestions` draft a human approves.
 */
export const draftResultSchema = z.object({
  // Same cap as sendOutboundInput.text — an un-sendable draft is dead weight.
  body: z.string().trim().min(1).max(4096),
  rationale: z.string().trim().min(1).max(2000),
});
export type DraftResult = z.infer<typeof draftResultSchema> & {
  tokensIn: number;
  tokensOut: number;
};

export type DraftInput = {
  model: LanguageModel;
  /** The org's drafter agent config — persona/voice/rules live here. */
  drafter: { name: string; systemPrompt: string; businessRules: string | null };
  transcript: ObserverTranscriptEntry[];
  brain?: ObserverBrainContext;
  /** 'improve' rewrites `sourceText` instead of drafting from scratch. */
  mode: "suggest" | "improve";
  sourceText?: string;
};

const BASE_PROMPT = `Você é o redator de respostas do Bosun. Escreva uma sugestão de resposta para o agente humano revisar — NUNCA envie nada ao cliente.

Regras:
- Escreva em português brasileiro, tom profissional e natural do atendimento humano (não soe como bot).
- Responda o que o cliente perguntou por último; não invente fatos, preços ou compromissos que não estejam no contexto.
- Mensagens marcadas como [nota interna] são privadas — use como contexto, nunca como conteúdo da resposta.
- Se a conversa não tiver contexto suficiente para uma resposta útil, proponha uma pergunta de esclarecimento curta.
- rationale: 1 frase em português dizendo por que esta resposta funciona.
- Não inclua saudações de despedida longas nem assinatura, a menos que o contexto peça.`;

const IMPROVE_PROMPT = `Você é o revisor de respostas do Bosun. Reescreva o texto do agente para ficar mais claro, empático e eficaz — mantendo a intenção original.

Regras:
- Escreva em português brasileiro, tom profissional e natural.
- Não invente fatos nem compromissos; só melhore o que está escrito.
- rationale: 1 frase em português dizendo o que melhorou.`;

function buildSystem(input: DraftInput): string {
  const rules = input.drafter.businessRules
    ? `\n\n## Regras de negócio\n${input.drafter.businessRules}`
    : "";
  const persona = input.drafter.systemPrompt.trim();
  return persona ? `${persona}${rules}\n\n${BASE_PROMPT}` : `${BASE_PROMPT}${rules}`;
}

function buildPrompt(input: DraftInput): string {
  const transcript = input.transcript
    .map(
      (m) =>
        `${m.private ? "[nota interna] " : ""}${m.direction === "inbound" ? "Cliente" : "Agente"}: ${m.text}`,
    )
    .join("\n");

  const canon = input.brain?.canon ?? [];
  const brain = canon.length
    ? `\n\n## Como esta empresa atende (memória operacional)\n${canon
        .map((e) => `- "${e.content}"`)
        .join("\n")}`
    : "";

  const heading = input.mode === "improve" ? "## Conversa (contexto)" : "## Conversa";
  const thread = `${heading}\n${transcript || "(vazia)"}${brain}`;
  return input.mode === "improve"
    ? `## Texto do agente para melhorar\n"${input.sourceText ?? ""}"\n\n${thread}`
    : thread;
}

/**
 * One drafter pass — pure function of (model, data). The caller resolves
 * credentials, the transcript and the brain context; nothing here touches
 * the DB or sends messages.
 */
export async function draftReply(input: DraftInput): Promise<DraftResult> {
  const result = await generateObject({
    model: input.model,
    schema: draftResultSchema,
    system: input.mode === "improve" ? IMPROVE_PROMPT : buildSystem(input),
    prompt: buildPrompt(input),
  });

  return {
    body: result.object.body,
    rationale: result.object.rationale,
    tokensIn: result.usage.inputTokens ?? 0,
    tokensOut: result.usage.outputTokens ?? 0,
  };
}
