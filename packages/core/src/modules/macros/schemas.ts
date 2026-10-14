import { z } from "zod";

/** `/trigger` slug — lowercase, starts with a letter; no spaces so the composer can tokenize it. */
export const macroNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z][a-z0-9_-]*$/, "lowercase slug starting with a letter");

export const createMacroInput = z.object({
  name: macroNameSchema,
  content: z.string().trim().min(1).max(4000),
});
export type CreateMacroInput = z.input<typeof createMacroInput>;

export const updateMacroInput = createMacroInput.partial();
export type UpdateMacroInput = z.input<typeof updateMacroInput>;

/** Agent proposal — same shape as create plus the review rationale. */
export const proposeMacroInput = createMacroInput.extend({
  rationale: z.string().trim().min(1).max(4000),
});
export type ProposeMacroInput = z.input<typeof proposeMacroInput>;
