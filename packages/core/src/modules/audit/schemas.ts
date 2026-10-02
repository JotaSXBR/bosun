import { z } from "zod";

export const recordAuditEventInput = z.object({
  action: z.string().min(1),
  targetType: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type RecordAuditEventInput = z.input<typeof recordAuditEventInput>;

export const listAuditEventsInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListAuditEventsInput = z.input<typeof listAuditEventsInput>;
