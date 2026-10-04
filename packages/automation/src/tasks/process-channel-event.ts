import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const processChannelEventPayload = z.object({
  organizationId: z.uuid(),
  channelConnectionId: z.uuid(),
  eventType: z.enum(["message.received", "message.status", "connection.status"]),
  messageId: z.uuid().optional(),
});

export type ProcessChannelEventPayload = z.infer<typeof processChannelEventPayload>;

/**
 * Fan-out point for channel events after they are persisted by webhook
 * ingestion. Future AI/automation reactions (auto-replies, triage, realtime
 * notifications) hook in here — payloads carry identity only, never
 * credentials or message bodies; handlers re-read data under the tenant.
 */
export const processChannelEventTask = schemaTask({
  id: "process-channel-event",
  schema: processChannelEventPayload,
  run: (payload) => {
    return Promise.resolve({ received: true, eventType: payload.eventType });
  },
});
