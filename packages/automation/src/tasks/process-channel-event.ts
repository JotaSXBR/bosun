import { maybeSendOffHoursReply, maybeSendUnsupportedMediaReply } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { z } from "zod";

export const processChannelEventPayload = z.object({
  organizationId: z.uuid(),
  channelConnectionId: z.uuid(),
  eventType: z.enum([
    "message.received",
    "message.status",
    "message.reaction",
    "message.edited",
    "message.revoked",
    "contact.presence",
    "connection.status",
  ]),
  conversationId: z.uuid().optional(),
  messageId: z.uuid().optional(),
});

export type ProcessChannelEventPayload = z.infer<typeof processChannelEventPayload>;

/**
 * Fan-out point for channel events after they are persisted by webhook
 * ingestion. Automation reactions hook in here — payloads carry identity
 * only, never credentials or message bodies; handlers re-read data under
 * the tenant. Today: the off-hours and unsupported-media auto-replies on
 * inbound messages.
 */
export async function processChannelEventHandler(payload: unknown): Promise<{
  received: boolean;
  eventType: string;
  offHoursReply?: boolean;
  unsupportedMediaReply?: boolean;
}> {
  const parsed = processChannelEventPayload.parse(payload);
  if (parsed.eventType === "message.received" && parsed.conversationId) {
    const result = await maybeSendOffHoursReply(getDb(), {
      organizationId: parsed.organizationId,
      conversationId: parsed.conversationId,
    });
    // Off-hours wins per inbound: if it answered this event, the
    // unsupported-media reply is skipped — one system bubble per inbound.
    const unsupported =
      parsed.messageId && !result.sent
        ? await maybeSendUnsupportedMediaReply(getDb(), {
            organizationId: parsed.organizationId,
            conversationId: parsed.conversationId,
            messageId: parsed.messageId,
          })
        : { sent: false };
    return {
      received: true,
      eventType: parsed.eventType,
      offHoursReply: result.sent,
      unsupportedMediaReply: unsupported.sent,
    };
  }
  return { received: true, eventType: parsed.eventType };
}
