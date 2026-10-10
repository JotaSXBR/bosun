import { z } from "zod";

/**
 * Inbox views — the tabs of the workbench (spec docs/product/inbox.md):
 * `pending` intake futuro, `queue` open+unassigned, `mine` own active,
 * `all` every active, `snoozed` deferred, `closed` resolved+closed.
 */
export const conversationView = z.enum(["pending", "queue", "mine", "all", "snoozed", "closed"]);
export type ConversationView = z.infer<typeof conversationView>;

export const listConversationsInput = z.object({
  view: conversationView.default("queue"),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().trim().min(1).max(100).optional(),
  channelConnectionId: z.uuid().optional(),
  sectorId: z.uuid().optional(),
  /** Last message inbound — the cheap "unread" signal (no read cursor yet). */
  awaitingReply: z.boolean().optional(),
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

/** Defer a ticket — `until` in the future; `null` resumes it immediately. */
export const snoozeConversationInput = z.object({
  conversationId: z.uuid(),
  until: z.coerce.date().nullable(),
});
export type SnoozeConversationInput = z.input<typeof snoozeConversationInput>;

/** Exactly one target: a user (assign + in_progress) or a team (queue). */
export const transferConversationInput = z.union([
  z.object({ conversationId: z.uuid(), assigneeId: z.uuid() }),
  z.object({ conversationId: z.uuid(), sectorId: z.uuid() }),
]);
export type TransferConversationInput = z.input<typeof transferConversationInput>;

/** Agent reply to the customer — plain text; media/replies use sendChannelInput. */
export const sendOutboundInput = z.object({
  conversationId: z.uuid(),
  text: z.string().trim().min(1).max(4096),
});
export type SendOutboundInput = z.input<typeof sendOutboundInput>;

/** Outbound-first ticket: open a conversation with a contact on a connection. */
export const startOutboundConversationInput = z.object({
  channelConnectionId: z.uuid(),
  contactId: z.uuid(),
});
export type StartOutboundConversationInput = z.input<typeof startOutboundConversationInput>;

/** Internal note — visible to the team, never sent to the provider. */
export const internalNoteInput = z.object({
  conversationId: z.uuid(),
  text: z.string().trim().min(1).max(4096),
});
export type InternalNoteInput = z.input<typeof internalNoteInput>;

/**
 * Channel message content — text or a media file already uploaded to
 * storage (url is the signed GET the provider fetches).
 */
export const sendChannelInput = z.object({
  conversationId: z.uuid(),
  content: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("text"),
      text: z.string().trim().min(1).max(4096),
      quotedExternalId: z.string().max(200).optional(),
    }),
    z.object({
      type: z.literal("media"),
      mediaKind: z.enum(["image", "video", "audio", "document"]),
      url: z.url().max(2048),
      mimeType: z.string().max(100).optional(),
      caption: z.string().trim().max(1024).optional(),
      filename: z.string().max(255).optional(),
      voiceNote: z.boolean().optional(),
      /** Object key of the uploaded blob — persisted for the media proxy. */
      storageKey: z.string().max(300).optional(),
    }),
  ]),
  replyToId: z.string().max(200).optional(),
});
export type SendChannelInput = z.input<typeof sendChannelInput>;

/** Targets one stored message of the conversation. */
export const messageActionInput = z.object({
  conversationId: z.uuid(),
  messageId: z.uuid(),
});
export type MessageActionInput = z.input<typeof messageActionInput>;

/** Empty emoji removes the caller's reaction. */
export const reactMessageInput = messageActionInput.extend({
  emoji: z.string().min(0).max(16),
});
export type ReactMessageInput = z.input<typeof reactMessageInput>;

export const editMessageInput = messageActionInput.extend({
  text: z.string().trim().min(1).max(4096),
});
export type EditMessageInput = z.input<typeof editMessageInput>;

export const presenceInput = z.object({
  conversationId: z.uuid(),
  presence: z.enum(["typing", "recording", "paused"]),
});
export type PresenceInput = z.input<typeof presenceInput>;
