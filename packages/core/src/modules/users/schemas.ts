import { z } from "zod";

/**
 * Personal preferences (users.preferences) — USER scope, never org data
 * (nav spec §6). `theme` mirrors the bosun-theme cookie; `sendSeen` gates the
 * WhatsApp read-tick on pickup and human outbound sends (not the bot's
 * anti-ban envelope); `toasts` gates the three InboxLive toasts.
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).default("dark"),
  sendSeen: z.boolean().default(true),
  toasts: z
    .object({
      drafts: z.boolean().default(true),
      nudges: z.boolean().default(true),
      suggestions: z.boolean().default(true),
    })
    .default({ drafts: true, nudges: true, suggestions: true }),
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

/** Merge-on-write: provided keys replace, absent keys keep. */
export const updateUserPreferencesInput = userPreferencesSchema.partial();
export type UpdateUserPreferencesInput = z.input<typeof updateUserPreferencesInput>;
