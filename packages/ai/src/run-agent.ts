import type { TenantContext } from "@crm/core";
import { assertPermission } from "@crm/core";
import type { LanguageModel, ModelMessage } from "ai";
import { generateText, stepCountIs } from "ai";

import type { AgentDefinition } from "./agent";
import type { AgentToolRegistry } from "./tools";
import { buildToolSet } from "./tools";

export type RunAgentInput = {
  ctx: TenantContext;
  agent: AgentDefinition;
  model: LanguageModel;
  registry: AgentToolRegistry;
  prompt?: string;
  messages?: ModelMessage[];
};

export type RunAgentResult = {
  text: string;
  steps: number;
};

/**
 * Runs an agent turn. The caller's ctx must satisfy `agent.permissions`;
 * tools are additionally filtered per-tool by permission. The agent gets no
 * DB access — only the permissioned tool surface.
 */
export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  assertPermission(input.ctx, input.agent.permissions);
  const tools = buildToolSet(input.ctx, input.registry, input.agent);
  const result = await generateText({
    model: input.model,
    system: input.agent.instructions,
    ...(input.messages ? { messages: input.messages } : { prompt: input.prompt ?? "" }),
    tools,
    stopWhen: stepCountIs(input.agent.guardrails.maxSteps),
    ...(input.agent.guardrails.maxOutputTokens
      ? { maxOutputTokens: input.agent.guardrails.maxOutputTokens }
      : {}),
  });
  return { text: result.text, steps: result.steps.length };
}
