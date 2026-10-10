import { z } from "zod";

/** Draft payload inside `agent_suggestions.payload` — the proposed reply body. */
export const draftPayloadSchema = z.object({
  // Same cap as sendOutboundInput.text — an un-sendable draft is dead weight.
  body: z.string().trim().min(1).max(4096),
});
export type DraftPayload = z.infer<typeof draftPayloadSchema>;

/** Composer request — 'suggest' drafts from the transcript; 'improve' rewrites sourceText. */
export const requestDraftInput = z.object({
  conversationId: z.uuid(),
  mode: z.enum(["suggest", "improve"]).default("suggest"),
  sourceText: z.string().trim().min(1).max(4096).optional(),
});
export type RequestDraftInput = z.input<typeof requestDraftInput>;

export const reviewDraftInput = z.object({
  suggestionId: z.uuid(),
});
export type ReviewDraftInput = z.input<typeof reviewDraftInput>;
