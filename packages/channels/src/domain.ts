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

/** Live session details beyond the coarse status (WAHA /me + session). */
export type SessionInfo = {
  status: ConnectionStatus;
  /** Paired phone number without the "@c.us" suffix (WAHA /me). */
  phone?: string;
  /** WhatsApp display name of the paired account. */
  pushName?: string;
  /** Active restriction warnings (e.g. "reachout_timelock", "message_capping"). */
  warnings: string[];
};

/** WAHA server build info (GET /api/server/version). */
export type ServerInfo = {
  version: string;
  engine: string;
  tier?: string;
};

/** A chat as the provider lists it (WAHA chats/overview). */
export type ExternalChat = {
  id: string;
  name?: string;
  lastMessageAt?: Date;
};

/** One inbound message — shared by live webhooks and backfill listing. */
export type InboundChannelMessage = {
  externalMessageId: string;
  from: Participant;
  content: MessageContent;
  timestamp: Date;
};

export type ChannelEvent =
  | ({ type: "message.received" } & InboundChannelMessage)
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
