// WAHA payload schemas + mappers — kept apart from the provider class so
// each file stays small. Everything here is pure (no fetch, no I/O).
import { z } from "zod";

import type {
  ChannelEvent,
  ConnectionStatus,
  InboundChannelMessage,
  MessageContent,
} from "../domain";

export type WahaConfig = {
  baseUrl: string;
  apiKey: string;
  session: string;
  webhookHmacKey?: string | undefined;
  /**
   * Public URL WAHA posts session events to — per-connection webhook
   * (`APP_URL` + `/api/webhooks/channels/<token>`). When set, connect()
   * (re)registers it on the session config.
   */
  webhookUrl?: string | undefined;
};

/**
 * Events subscribed on the session webhook — the full set the product
 * uses (incl. brief-2 events: reaction/edited/revoked/presence), so the
 * session config does not need re-writing when those land.
 */
export const WAHA_WEBHOOK_EVENTS = [
  "message",
  "message.ack",
  "message.reaction",
  "message.edited",
  "message.revoked",
  "session.status",
  "presence.update",
] as const;

/** WAHA retry policy — exponential 5s×8 ≈ 21min window, covers deploys. */
export const WAHA_WEBHOOK_RETRIES = {
  policy: "exponential",
  delaySeconds: 5,
  attempts: 8,
} as const;

export type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export const wahaSessionSchema = z.looseObject({
  name: z.string(),
  status: z.string(),
});

export const wahaWebhookSchema = z.looseObject({
  event: z.string(),
  session: z.string().optional(),
  timestamp: z.number().optional(),
  payload: z.unknown(),
});

export const wahaMessageSchema = z.looseObject({
  id: z.string(),
  from: z.string(),
  fromMe: z.boolean().optional(),
  body: z.string().optional(),
  timestamp: z.number().optional(),
  hasMedia: z.boolean().optional(),
  mediaUrl: z.string().optional(),
  mimetype: z.string().optional(),
  filename: z.string().optional(),
  notifyName: z.string().optional(),
});

export const wahaAckSchema = z.looseObject({
  id: z.string(),
  ack: z.number(),
});

export const wahaSessionStatusSchema = z.looseObject({
  status: z.string(),
});

export const wahaPairingCodeSchema = z.looseObject({
  code: z.string(),
});

/** GET /api/sessions/{s}/me — `id` is the paired jid ("5511...@c.us"). */
export const wahaMeSchema = z.looseObject({
  id: z.string().optional(),
  pushName: z.string().optional(),
  reachoutTimelock: z.unknown().optional(),
  messageCapping: z.looseObject({ state: z.string().optional() }).nullable().optional(),
});

export const wahaServerVersionSchema = z.looseObject({
  version: z.string(),
  engine: z.string().optional(),
  tier: z.string().optional(),
});

/** GET /api/{s}/chats/overview rows. */
export const wahaChatSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  lastMessage: z.looseObject({ timestamp: z.number().optional() }).nullable().optional(),
});

export function mapSessionStatus(status: string): ConnectionStatus {
  switch (status) {
    case "WORKING":
      return "connected";
    case "STARTING":
    case "SCAN_QR_CODE":
    case "PASSKEY_REQUIRED":
    case "PASSKEY_CONFIRMATION_REQUIRED":
      return "connecting";
    case "FAILED":
      return "error";
    default:
      return "disconnected";
  }
}

/** WAHA ack codes: -1 error, 0 pending, 1 server, 2 device, 3 read, 4 played. */
function mapAck(ack: number): "sent" | "delivered" | "read" | "failed" | null {
  switch (ack) {
    case -1:
      return "failed";
    case 1:
      return "sent";
    case 2:
      return "delivered";
    case 3:
    case 4:
      return "read";
    default:
      return null; // 0 = pending and unknown codes are ignored
  }
}

export function wahaToInbound(
  data: z.infer<typeof wahaMessageSchema>,
  fallbackTimestamp?: number,
): InboundChannelMessage {
  return {
    externalMessageId: data.id,
    from: {
      channelUserId: data.from,
      ...(data.notifyName ? { displayName: data.notifyName } : {}),
    },
    content: wahaMessageContent(data),
    timestamp: new Date((data.timestamp ?? fallbackTimestamp ?? 0) * 1000),
  };
}

export function wahaMessageToEvents(
  payload: unknown,
  timestamp: number | undefined,
): ChannelEvent[] {
  const message = wahaMessageSchema.safeParse(payload);
  if (!message.success || message.data.fromMe) return [];
  return [{ type: "message.received", ...wahaToInbound(message.data, timestamp) }];
}

function wahaMessageContent(data: z.infer<typeof wahaMessageSchema>): MessageContent {
  if (!data.hasMedia) return { type: "text", text: data.body ?? "" };
  return {
    type: "media",
    mediaKind: "document",
    source: { type: "url", url: data.mediaUrl ?? "" },
    ...(data.mimetype ? { mimeType: data.mimetype } : {}),
    ...(data.filename ? { filename: data.filename } : {}),
    ...(data.body ? { caption: data.body } : {}),
  };
}

export function wahaAckToEvents(payload: unknown, timestamp: number | undefined): ChannelEvent[] {
  const ack = wahaAckSchema.safeParse(payload);
  if (!ack.success) return [];
  const status = mapAck(ack.data.ack);
  if (!status) return [];
  return [
    {
      type: "message.status",
      externalMessageId: ack.data.id,
      status,
      timestamp: new Date(timestamp ?? Date.now()),
    },
  ];
}

export function wahaSessionStatusToEvents(payload: unknown): ChannelEvent[] {
  const session = wahaSessionStatusSchema.safeParse(payload);
  if (!session.success) return [];
  return [{ type: "connection.status", status: mapSessionStatus(session.data.status) }];
}
