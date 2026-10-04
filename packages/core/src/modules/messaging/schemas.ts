import { z } from "zod";

export const listConversationsInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListConversationsInput = z.input<typeof listConversationsInput>;

export const listMessagesInput = z.object({
  conversationId: z.uuid(),
  limit: z.number().int().min(1).max(200).default(100),
});

export type ListMessagesInput = z.input<typeof listMessagesInput>;
