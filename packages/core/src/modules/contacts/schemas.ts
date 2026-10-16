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

/**
 * Ficha fields — `displayName` is a column; the rest live flat in
 * `contacts.metadata` (the standard People-API-shaped profile). An empty
 * string / empty list clears the key. `urls` is user data that will be
 * mirrored to Google, so only http(s) is accepted.
 */
export const updateContactProfileInput = z.object({
  contactId: z.uuid(),
  displayName: z.string().trim().min(1).max(120).optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  phone: z.string().trim().max(32).optional(),
  notes: z.string().max(4000).optional(),
  company: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500).optional(),
  birthday: z.union([z.literal(""), z.iso.date()]).optional(),
  urls: z
    .array(z.url({ protocol: /^https?$/ }).max(300))
    .max(5)
    .optional(),
});
export type UpdateContactProfileInput = z.input<typeof updateContactProfileInput>;
