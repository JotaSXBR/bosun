// Domain model for messaging channels — provider-agnostic by design.
// Nothing here references WAHA or Meta payload shapes.

export type ChannelProviderKind = "waha" | "meta_cloud";

export type MessageContent =
  | { type: "text"; text: string }
  | {
      type: "media";
      mediaKind: "image" | "video" | "audio" | "document";
      source: { type: "url"; url: string } | { type: "provider"; id: string };
      mimeType?: string;
      caption?: string;
      filename?: string;
    };

export type Participant = {
  channelUserId: string;
  displayName?: string;
};

export type OutboundMessage = {
  /** Recipient id in channel terms (WhatsApp chatId / phone number). */
  to: string;
  content: MessageContent;
};

export type SendMessageResult = {
  externalId: string;
  status: "sent" | "queued";
};

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export type ConnectResult = {
  status: ConnectionStatus;
  /** QR to display while pairing (WAHA). */
  qrCode?: { mimeType: string; data: string };
};

export type ChannelEvent =
  | {
      type: "message.received";
      externalMessageId: string;
      from: Participant;
      content: MessageContent;
      timestamp: Date;
    }
  | {
      type: "message.status";
      externalMessageId: string;
      status: "sent" | "delivered" | "read" | "failed";
      timestamp: Date;
    }
  | { type: "connection.status"; status: ConnectionStatus };

/**
 * A webhook HTTP request after the transport layer stripped it down.
 * `rawBody` must be the exact bytes received (needed for HMAC), header names
 * are lowercased.
 */
export type RawWebhookRequest = {
  rawBody: string;
  headers: Record<string, string>;
  query: Record<string, string>;
};
