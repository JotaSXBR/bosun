import { z } from "zod";

export const createContactInput = z.object({
  displayName: z.string().trim().min(1).max(120),
  /** International digits; normalized to a WhatsApp chatId by the service. */
  phone: z.string().trim().min(1).max(32),
  email: z.email().optional(),
});
export type CreateContactInput = z.input<typeof createContactInput>;

export const listContactsInput = z.object({
  query: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListContactsInput = z.input<typeof listContactsInput>;
