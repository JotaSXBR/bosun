import { z } from "zod";

/** Inbox views: full list, the open queue, the agent's own tickets, history. */
export const conversationView = z.enum(["inbox", "queue", "mine", "resolved"]);
export type ConversationView = z.infer<typeof conversationView>;

export const listConversationsInput = z.object({
  view: conversationView.default("inbox"),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListConversationsInput = z.input<typeof listConversationsInput>;

export const listMessagesInput = z.object({
  conversationId: z.uuid(),
  limit: z.number().int().min(1).max(200).default(100),
});

export type ListMessagesInput = z.input<typeof listMessagesInput>;

export const conversationIdInput = z.object({
  conversationId: z.uuid(),
});
export type ConversationIdInput = z.input<typeof conversationIdInput>;

/** Exactly one target: a user (assign + in_progress) or a team (queue). */
export const transferConversationInput = z.union([
  z.object({ conversationId: z.uuid(), assigneeId: z.uuid() }),
  z.object({ conversationId: z.uuid(), sectorId: z.uuid() }),
]);
export type TransferConversationInput = z.input<typeof transferConversationInput>;

/** Agent reply to the customer — text only for v1 (media comes with uploads). */
export const sendOutboundInput = z.object({
  conversationId: z.uuid(),
  text: z.string().trim().min(1).max(4096),
});
export type SendOutboundInput = z.input<typeof sendOutboundInput>;

/** Internal note — visible to the team, never sent to the provider. */
export const internalNoteInput = z.object({
  conversationId: z.uuid(),
  text: z.string().trim().min(1).max(4096),
});
export type InternalNoteInput = z.input<typeof internalNoteInput>;
