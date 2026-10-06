// WAHA payload schemas + mappers — kept apart from the provider class so
// each file stays small. Everything here is pure (no fetch, no I/O).
import { z } from "zod";

import type {
  ChannelEvent,
  ConnectionStatus,
  InboundChannelMessage,
  MessageContent,
  PresenceKind,
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
  config: z
    .looseObject({
      webhooks: z.array(z.looseObject({ url: z.string() })).optional(),
    })
    .optional(),
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
  fromMe: z.boolean().nullish(),
  body: z.string().nullish(),
  timestamp: z.number().nullish(),
  hasMedia: z.boolean().nullish(),
  mediaUrl: z.string().nullish(),
  mimetype: z.string().nullish(),
  filename: z.string().nullish(),
  // Engines disagree on the media shape — accept both flat and nested.
  // GOWS emits explicit nulls (media/replyTo/etc.) where WEBJS omits keys.
  media: z
    .looseObject({
      url: z.string().nullish(),
      mimetype: z.string().nullish(),
      filename: z.string().nullish(),
    })
    .nullish(),
  replyTo: z
    .looseObject({
      // GOWS sends the bare stanzaID; WEBJS the full serialized id.
      id: z.string().nullish(),
      participant: z.string().nullish(),
    })
    .nullish(),
  notifyName: z.string().nullish(),
  // GOWS keeps the raw engine event here — display name lives at
  // _data.Info.PushName (WEBJS uses the top-level notifyName).
  _data: z
    .looseObject({
      Info: z.looseObject({ PushName: z.string().nullish() }).nullish(),
    })
    .nullish(),
});

export const wahaReactionSchema = z.looseObject({
  fromMe: z.boolean().nullish(),
  from: z.string().nullish(),
  participant: z.string().nullish(),
  // messageId is the FULL external id ("true_123@c.us_AAA"); text "" = removed.
  reaction: z.looseObject({ text: z.string().nullish(), messageId: z.string() }),
});

export const wahaEditedSchema = z.looseObject({
  // id is the edit *action* id: "false_{chatId}_{actionId}[_participant]"
  id: z.string(),
  // bare message id — no chatId, no true_/false_ prefix.
  editedMessageId: z.string(),
  body: z.string().nullish(),
});

export const wahaRevokedSchema = z.looseObject({
  // WEBJS carries the pre-revoke message in `before`; GOWS sends before:null
  // plus the bare `revokedMessageId` to compose from the action in `after`.
  before: z.looseObject({ id: z.string().nullish() }).nullish(),
  after: z.looseObject({ id: z.string().nullish(), fromMe: z.boolean().nullish() }).nullish(),
  revokedMessageId: z.string().nullish(),
});

export const wahaPresenceSchema = z.looseObject({
  id: z.string(),
  presences: z
    .array(
      z.looseObject({
        participant: z.string().optional(),
        lastKnownPresence: z.string().optional(),
      }),
    )
    .optional(),
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
  const displayName = data.notifyName ?? data._data?.Info?.PushName ?? undefined;
  return {
    externalMessageId: data.id,
    from: {
      channelUserId: data.from,
      ...(displayName ? { displayName } : {}),
    },
    content: wahaMessageContent(data),
    // payload ts is seconds; the envelope fallback is already milliseconds.
    timestamp: new Date(data.timestamp ? data.timestamp * 1000 : (fallbackTimestamp ?? 0)),
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
  const quotedId = wahaQuotedExternalId(data);
  const quoted = quotedId ? { quotedExternalId: quotedId } : {};
  if (!data.hasMedia) return { type: "text", text: data.body ?? "", ...quoted };
  return wahaMediaContent(data, quoted);
}

/**
 * GOWS `replyTo.id` is the bare stanzaID while stored external ids are
 * "{fromMe}_{chatId}_{stanzaID}" — compose it. `replyTo.participant` names
 * the quoted author: equal to `from` ⇒ peer-authored (false_), otherwise
 * ours (true_). Missing participant defaults to the peer (common reply case).
 */
function wahaQuotedExternalId(data: z.infer<typeof wahaMessageSchema>): string | undefined {
  const stanza = data.replyTo?.id;
  if (!stanza) return undefined;
  if (stanza.includes("@")) return stanza; // already serialized (WEBJS)
  const chatId = data.id.split("_")[1];
  if (!chatId) return undefined;
  const peerAuthored = !data.replyTo?.participant || data.replyTo.participant === data.from;
  return `${peerAuthored ? "false" : "true"}_${chatId}_${stanza}`;
}

function wahaMediaContent(
  data: z.infer<typeof wahaMessageSchema>,
  quoted: { quotedExternalId?: string },
): MessageContent {
  const mimeType = data.mimetype ?? data.media?.mimetype;
  const filename = data.filename ?? data.media?.filename ?? undefined;
  return {
    type: "media",
    mediaKind: wahaMediaKind(mimeType),
    source: { type: "url", url: data.mediaUrl ?? data.media?.url ?? "" },
    ...(mimeType ? { mimeType } : {}),
    ...(filename ? { filename } : {}),
    ...(data.body ? { caption: data.body } : {}),
    ...quoted,
  };
}

function wahaMediaKind(
  mimeType: string | null | undefined,
): "image" | "video" | "audio" | "document" {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  return "document";
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

export function wahaReactionToEvents(payload: unknown): ChannelEvent[] {
  const reaction = wahaReactionSchema.safeParse(payload);
  if (!reaction.success) return [];
  return [
    {
      type: "message.reaction",
      messageExternalId: reaction.data.reaction.messageId,
      emoji: reaction.data.reaction.text ?? "",
      actorChannelUserId: reaction.data.participant ?? reaction.data.from ?? null,
      fromMe: reaction.data.fromMe ?? false,
    },
  ];
}

export function wahaEditedToEvents(payload: unknown): ChannelEvent[] {
  const edited = wahaEditedSchema.safeParse(payload);
  if (!edited.success) return [];
  // The chat id is the middle segment of the action id.
  const chatId = edited.data.id.split("_")[1];
  if (!chatId) return [];
  const messageId = edited.data.editedMessageId;
  return [
    {
      type: "message.edited",
      messageExternalIds: [`true_${chatId}_${messageId}`, `false_${chatId}_${messageId}`],
      newText: edited.data.body ?? "",
    },
  ];
}

export function wahaRevokedToEvents(payload: unknown): ChannelEvent[] {
  const revoked = wahaRevokedSchema.safeParse(payload);
  if (!revoked.success) return [];
  const { before, after, revokedMessageId } = revoked.data;
  if (before?.id) {
    return [{ type: "message.revoked", messageExternalId: before.id }];
  }
  // GOWS: compose "{fromMe}_{chat}_{stanza}" — the revoke actor in `after` is
  // always the revoked message's author (delete-for-everyone is self-only).
  const chatId = after?.id?.split("_")[1];
  if (!chatId || !revokedMessageId) return [];
  const fromMe = after.fromMe === true ? "true" : "false";
  return [
    { type: "message.revoked", messageExternalId: `${fromMe}_${chatId}_${revokedMessageId}` },
  ];
}

const PRESENCE_KINDS = new Set<string>(["online", "offline", "typing", "recording", "paused"]);

export function wahaPresenceToEvents(payload: unknown): ChannelEvent[] {
  const parsed = wahaPresenceSchema.safeParse(payload);
  if (!parsed.success) return [];
  const events: ChannelEvent[] = [];
  for (const presence of parsed.data.presences ?? []) {
    if (!presence.lastKnownPresence || !PRESENCE_KINDS.has(presence.lastKnownPresence)) continue;
    events.push({
      type: "contact.presence",
      chatId: parsed.data.id,
      participant: presence.participant ?? null,
      presence: presence.lastKnownPresence as PresenceKind,
    });
  }
  return events;
}
