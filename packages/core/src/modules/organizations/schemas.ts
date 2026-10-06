import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:mm");

const weekday = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/**
 * Weekly opening windows per weekday, interpreted in the org's timezone.
 * `{ windows: { mon: [{ start: "09:00", end: "18:00" }] } }` — days absent
 * from `windows` are closed. (Provisional shape — the off-hours auto-reply
 * lands in a later brief.)
 */
export const businessHoursSchema = z.object({
  windows: z
    .partialRecord(weekday, z.array(z.object({ start: hhmm, end: hhmm })).max(4))
    .default({}),
});
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const updateOrgSettingsInput = z.object({
  businessHours: businessHoursSchema.optional(),
  offHoursMessage: z.string().trim().max(500).nullish(),
  timezone: z.string().trim().min(1).max(64).optional(),
  locale: z.string().trim().min(2).max(16).optional(),
  // Hours a resolved ticket stays reopenable (product rules: 1h–7d).
  ticketReopenWindowHours: z.number().int().min(1).max(168).optional(),
});
export type UpdateOrgSettingsInput = z.input<typeof updateOrgSettingsInput>;
