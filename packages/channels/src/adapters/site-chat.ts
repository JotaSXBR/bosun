import { z } from "zod";

import type {
  ChannelEvent,
  ConnectionStatus,
  ConnectResult,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
} from "../domain";
import type { ChannelProvider } from "../provider";

/**
 * First-party widget channel — validates the ChannelProvider abstraction
 * without a third-party API. The "webhook" is the public widget endpoint's
 * own JSON body: the route resolves the visitor session first (identity
 * comes from `site_chat_sessions`, not from the payload), then this
 * provider verifies/normalizes it like any other inbound.
 *
 * Outbound is a no-op: agent messages are already persisted +
 * domain-event'd on the write path; the widget's public SSE stream +
 * history endpoint deliver them. There is no remote to push to.
 */
export class SiteChatChannelProvider implements ChannelProvider {
  readonly kind = "site_chat" as const;
  readonly capabilities = { qrCodeConnect: false, media: false };

  /** Body shape the widget message route posts through the pipeline. */
  static readonly inboundBodySchema = z.object({
    sessionToken: z.string().min(1),
    text: z.string().min(1).max(4000),
    /** Client-generated id for retry-safe dedupe; falls back to a fresh uuid. */
    clientMessageId: z.string().min(1).max(64).optional(),
    from: z.object({
      channelUserId: z.string().min(1),
      displayName: z.string().min(1).optional(),
    }),
  });

  connect(): Promise<ConnectResult> {
    return Promise.resolve({ status: "connected" });
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  getConnectionStatus(): Promise<ConnectionStatus> {
    return Promise.resolve("connected");
  }

  sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    if (message.content.type !== "text") {
      return Promise.reject(new Error("site_chat supports text only"));
    }
    return Promise.resolve({ externalId: crypto.randomUUID(), status: "sent" });
  }

  verifyWebhook(request: RawWebhookRequest): boolean {
    try {
      return SiteChatChannelProvider.inboundBodySchema.safeParse(JSON.parse(request.rawBody))
        .success;
    } catch {
      return false;
    }
  }

  parseWebhook(request: RawWebhookRequest): ChannelEvent[] {
    const parsed = SiteChatChannelProvider.inboundBodySchema.safeParse(JSON.parse(request.rawBody));
    if (!parsed.success) return [];
    const body = parsed.data;
    return [
      {
        type: "message.received",
        externalMessageId: body.clientMessageId ?? crypto.randomUUID(),
        from: {
          channelUserId: body.from.channelUserId,
          displayName: body.from.displayName,
        },
        content: { type: "text", text: body.text },
        timestamp: new Date(),
      },
    ];
  }
}
