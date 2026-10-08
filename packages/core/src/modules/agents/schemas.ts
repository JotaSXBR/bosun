import { z } from "zod";

import { llmProviderSchema } from "../ai";

export const agentStatusSchema = z.enum(["draft", "active", "paused"]);

export const modelRefSchema = z.object({
  provider: llmProviderSchema,
  modelId: z.string().trim().min(1).max(120),
  fallbacks: z.array(z.string().trim().min(1).max(120)).max(4).optional(),
});

export const availabilityWindowSchema = z.object({
  timezone: z.string().trim().max(64).optional(),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  startMinute: z.number().int().min(0).max(1439).optional(),
  endMinute: z.number().int().min(0).max(1439).optional(),
});

export const createAgentInput = z.object({
  name: z.string().trim().min(1).max(100),
  specialty: z.string().trim().max(200).optional(),
  status: agentStatusSchema.default("draft"),
  modelRef: modelRefSchema.nullish(),
  systemPrompt: z.string().trim().max(8000).default(""),
  businessRules: z.string().trim().max(8000).nullish(),
  toolsAllowlist: z.array(z.string().trim().min(1).max(80)).max(64).default([]),
  availabilityWindow: availabilityWindowSchema.nullish(),
  memoryTokenCap: z.number().int().min(256).max(128_000).nullish(),
  toolExecutionLimit: z.number().int().min(1).max(50).nullish(),
  signatureLine: z.string().trim().max(280).nullish(),
});
export type CreateAgentInput = z.input<typeof createAgentInput>;

export const updateAgentInput = createAgentInput.partial().extend({
  agentId: z.uuid(),
});
export type UpdateAgentInput = z.input<typeof updateAgentInput>;
