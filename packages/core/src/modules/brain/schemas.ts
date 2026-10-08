import { z } from "zod";

/**
 * Second-brain taxonomy — fixed enum so the observer can't sprawl types.
 * `pattern` recurring behavior · `procedure` how-to · `faq_gap` question
 * knowledge can't answer · `decision` a choice + why · `preference` org
 * operational preference · `escalation` when to hand off · `persona` how
 * to address customers · `metric` known operational number.
 */
export const memoryEntryTypeSchema = z.enum([
  "pattern",
  "procedure",
  "faq_gap",
  "decision",
  "preference",
  "escalation",
  "persona",
  "metric",
]);
export type MemoryEntryType = z.infer<typeof memoryEntryTypeSchema>;

/** org = all readers · team = agents of one team · contact = that contact's conversations. */
export const memoryScopeSchema = z.enum(["org", "team", "contact"]);
export type MemoryScope = z.infer<typeof memoryScopeSchema>;

export const memoryConfidenceSchema = z.enum(["low", "medium", "high"]);
export type MemoryConfidence = z.infer<typeof memoryConfidenceSchema>;
export const memoryEntryStatusSchema = z.enum(["canon", "stale", "archived", "superseded"]);

/**
 * A proposed memory entry — the payload of `agent_suggestions` rows with
 * `target_type = 'memory'`. Approving inserts a canon row; `supersedes`
 * marks the previous entry superseded in the same transaction.
 */
const proposalShape = {
  type: memoryEntryTypeSchema,
  scope: memoryScopeSchema.default("org"),
  teamId: z.uuid().nullish(),
  contactId: z.uuid().nullish(),
  content: z.string().trim().min(1).max(2000),
  confidence: memoryConfidenceSchema.default("medium"),
  staleAfterDays: z.number().int().min(1).max(730).default(90),
  supersedes: z.uuid().nullish(),
  sourceConversationIds: z.array(z.uuid()).max(20).default([]),
};

const scopeRefCheck = (
  value: { scope: string; teamId?: string | null; contactId?: string | null },
  ctx: z.RefinementCtx,
): void => {
  if (value.scope === "team" && !value.teamId) {
    ctx.addIssue({ code: "custom", message: "team scope requires teamId" });
  }
  if (value.scope === "contact" && !value.contactId) {
    ctx.addIssue({ code: "custom", message: "contact scope requires contactId" });
  }
};

export const memoryProposalSchema = z.object(proposalShape).superRefine(scopeRefCheck);
export type MemoryProposal = z.infer<typeof memoryProposalSchema>;

/** Human-proposed staging entry — proposal fields + a required rationale. */
export const proposeEntryInput = z
  .object({ ...proposalShape, rationale: z.string().trim().min(1).max(4000) })
  .superRefine(scopeRefCheck);
export type ProposeEntryInput = z.input<typeof proposeEntryInput>;

export const listBrainEntriesInput = z.object({
  type: memoryEntryTypeSchema.optional(),
  scope: memoryScopeSchema.optional(),
  teamId: z.uuid().optional(),
  contactId: z.uuid().optional(),
  q: z.string().trim().min(2).max(200).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});
export type ListBrainEntriesInput = z.input<typeof listBrainEntriesInput>;

export const renewEntryInput = z.object({
  entryId: z.uuid(),
  staleAfterDays: z.number().int().min(1).max(730).default(90),
});
export type RenewEntryInput = z.input<typeof renewEntryInput>;
