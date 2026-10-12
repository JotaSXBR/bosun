import { z } from "zod";

export const knowledgeStatusSchema = z.enum(["active", "archived"]);

export const createKnowledgeEntryInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
  status: knowledgeStatusSchema.default("active"),
});
export type CreateKnowledgeEntryInput = z.input<typeof createKnowledgeEntryInput>;

export const updateKnowledgeEntryInput = z.object({
  entryId: z.uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(20_000).optional(),
  status: knowledgeStatusSchema.optional(),
});
export type UpdateKnowledgeEntryInput = z.input<typeof updateKnowledgeEntryInput>;

/** Human-proposed knowledge ("Ensinar a IA") — staged in agent_suggestions for review. */
export const proposeKnowledgeEntryInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
  rationale: z.string().trim().min(1).max(4000),
  sourceConversationId: z.uuid().nullish(),
});
export type ProposeKnowledgeEntryInput = z.input<typeof proposeKnowledgeEntryInput>;
