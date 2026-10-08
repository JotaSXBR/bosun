import { z } from "zod";

export const llmProviderSchema = z.enum(["openai", "anthropic", "openrouter"]);
export type LlmProvider = z.infer<typeof llmProviderSchema>;

/** Create — `apiKey` arrives plaintext and is encrypted before persist. */
export const createLlmCredentialInput = z.object({
  provider: llmProviderSchema,
  apiKey: z.string().trim().min(8).max(512),
  label: z.string().trim().min(1).max(100).optional(),
  model: z.string().trim().min(1).max(120),
  priority: z.number().int().min(0).max(99).default(0),
  zdr: z.boolean().default(false),
});
export type CreateLlmCredentialInput = z.input<typeof createLlmCredentialInput>;

export const updateLlmCredentialInput = z.object({
  credentialId: z.uuid(),
  label: z.string().trim().min(1).max(100).nullish(),
  model: z.string().trim().min(1).max(120).optional(),
  priority: z.number().int().min(0).max(99).optional(),
  zdr: z.boolean().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  /** Rotate the key — plaintext, encrypted before persist. */
  apiKey: z.string().trim().min(8).max(512).optional(),
});
export type UpdateLlmCredentialInput = z.input<typeof updateLlmCredentialInput>;
