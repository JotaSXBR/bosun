import { z } from "zod";

export const suggestionTargetSchema = z.enum(["agent", "knowledge_entry"]);
export type SuggestionTarget = z.infer<typeof suggestionTargetSchema>;

export const suggestionStatusSchema = z.enum(["pending", "approved", "rejected"]);

/** Field-level diff against the target entity — validated per target on approve. */
export const suggestionPayloadSchema = z.record(z.string(), z.unknown());

export const createSuggestionInput = z.object({
  targetType: suggestionTargetSchema,
  targetId: z.uuid().nullish(),
  payload: suggestionPayloadSchema,
  rationale: z.string().trim().min(1).max(4000),
  sourceConversationId: z.uuid().nullish(),
});
export type CreateSuggestionInput = z.input<typeof createSuggestionInput>;

export const listSuggestionsInput = z.object({
  status: suggestionStatusSchema.optional(),
  limit: z.number().int().min(1).max(200).default(100),
});
export type ListSuggestionsInput = z.input<typeof listSuggestionsInput>;

export const reviewSuggestionInput = z.object({
  suggestionId: z.uuid(),
});
export type ReviewSuggestionInput = z.input<typeof reviewSuggestionInput>;
