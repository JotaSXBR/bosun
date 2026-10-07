import { z } from "zod";

/**
 * Fixed color palette for stages and labels — UI renders these keys, never
 * raw hex, so themes stay consistent.
 */
export const COLOR_PALETTE = [
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;
export type PaletteColor = (typeof COLOR_PALETTE)[number];
const paletteColor = z.enum(COLOR_PALETTE);

const id = z.uuid();

const customAttributes = z.record(
  z.string().trim().min(1).max(100),
  z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
);
export type CustomAttributes = z.infer<typeof customAttributes>;

export const createFunnelInput = z.object({
  name: z.string().trim().min(1).max(100),
  templateRef: z.string().trim().min(1).max(50).optional(),
});
export type CreateFunnelInput = z.input<typeof createFunnelInput>;

export const updateFunnelInput = z.object({
  funnelId: id,
  name: z.string().trim().min(1).max(100).optional(),
});
export type UpdateFunnelInput = z.input<typeof updateFunnelInput>;

export const createStageInput = z.object({
  funnelId: id,
  name: z.string().trim().min(1).max(60),
  color: paletteColor.optional(),
});
export type CreateStageInput = z.input<typeof createStageInput>;

export const updateStageInput = z.object({
  stageId: id,
  name: z.string().trim().min(1).max(60).optional(),
  color: paletteColor.optional(),
});
export type UpdateStageInput = z.input<typeof updateStageInput>;

export const moveStageInput = z.object({
  stageId: id,
  position: z.number().int().min(0),
});
export type MoveStageInput = z.input<typeof moveStageInput>;

export const createDealInput = z.object({
  funnelId: id,
  stageId: id,
  contactId: id,
  title: z.string().trim().min(1).max(200),
  valueCents: z.number().int().min(0).optional(),
  customAttributes: customAttributes.optional(),
});
export type CreateDealInput = z.input<typeof createDealInput>;

export const createDealFromConversationInput = z.object({
  conversationId: id,
  funnelId: id,
  stageId: id,
  title: z.string().trim().min(1).max(200).optional(),
  valueCents: z.number().int().min(0).optional(),
});
export type CreateDealFromConversationInput = z.input<typeof createDealFromConversationInput>;

export const updateDealInput = z.object({
  dealId: id,
  title: z.string().trim().min(1).max(200).optional(),
  valueCents: z.number().int().min(0).optional(),
  customAttributes: customAttributes.optional(),
});
export type UpdateDealInput = z.input<typeof updateDealInput>;

export const moveDealInput = z.object({
  dealId: id,
  stageId: id,
  position: z.number().int().min(0),
});
export type MoveDealInput = z.input<typeof moveDealInput>;

export const createLabelInput = z.object({
  name: z.string().trim().min(1).max(40),
  color: paletteColor.optional(),
});
export type CreateLabelInput = z.input<typeof createLabelInput>;

export const updateLabelInput = z.object({
  labelId: id,
  name: z.string().trim().min(1).max(40).optional(),
  color: paletteColor.optional(),
});
export type UpdateLabelInput = z.input<typeof updateLabelInput>;

export const setDealLabelsInput = z.object({
  dealId: id,
  labelIds: z.array(id).max(20),
});
export type SetDealLabelsInput = z.input<typeof setDealLabelsInput>;

export const setConversationLabelsInput = z.object({
  conversationId: id,
  labelIds: z.array(id).max(20),
});
export type SetConversationLabelsInput = z.input<typeof setConversationLabelsInput>;
