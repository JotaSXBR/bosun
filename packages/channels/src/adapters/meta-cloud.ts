// Meta WhatsApp Cloud API adapter (graph.facebook.com).
// Send: POST /{version}/{phoneNumberId}/messages. Webhooks: signature
// `x-hub-signature-256: sha256=<hex>` (HMAC-SHA256 of the raw body with the
// App Secret); subscription handshake: GET challenge with hub.verify_token.
import { z } from "zod";

import type {
  ChannelEvent,
  ConnectionStatus,
  ConnectResult,
  MessageContent,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
} from "../domain";
import type { ChannelProvider } from "../provider";
import { verifyHmacSignature } from "../shared/hmac";
import type { FetchLike } from "./waha";

export type MetaCloudConfig = {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  graphApiVersion?: string | undefined;
};

const webhookSchema = z.looseObject({
  object: z.string().optional(),
  entry: z
    .array(
      z.looseObject({
        changes: z
          .array(
            z.looseObject({
              value: z.looseObject({
                messages: z.array(z.looseObject({})).optional(),
                statuses: z.array(z.looseObject({})).optional(),
              }),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

const metaMessageSchema = z.looseObject({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.looseObject({ body: z.string() }).optional(),
  image: z
    .looseObject({
      id: z.string(),
      mime_type: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
  video: z
    .looseObject({
      id: z.string(),
      mime_type: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
  audio: z.looseObject({ id: z.string(), mime_type: z.string().optional() }).optional(),
  document: z
    .looseObject({
      id: z.string(),
      mime_type: z.string().optional(),
      caption: z.string().optional(),
      filename: z.string().optional(),
    })
    .optional(),
});

const metaStatusSchema = z.looseObject({
  id: z.string(),
  status: z.string(),
  timestamp: z.string().optional(),
});

export class MetaCloudChannelProvider implements ChannelProvider {
  readonly kind = "meta_cloud" as const;
  readonly capabilities = { qrCodeConnect: false, media: true };

  private readonly apiBase: string;
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly config: MetaCloudConfig,
    deps?: { fetch?: FetchLike },
  ) {
    const version = config.graphApiVersion ?? "v26.0";
    this.apiBase = `https://graph.facebook.com/${version}`;
    this.fetchImpl = deps?.fetch ?? fetch;
  }

  /** Validates credentials by fetching the phone number node. */
  async connect(): Promise<ConnectResult> {
    const res = await this.fetchImpl(`${this.apiBase}/${this.config.phoneNumberId}`, {
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
    });
    return { status: res.ok ? "connected" : "error" };
  }

  /** Cloud API is stateless — nothing to tear down. */
  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return (await this.connect()).status;
  }

  async sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    const { content } = message;
    let body: Record<string, unknown>;
    if (content.type === "text") {
      body = {
        messaging_product: "whatsapp",
        to: message.to,
        type: "text",
        text: { body: content.text },
      };
    } else {
      const mediaPayload: Record<string, unknown> =
        content.source.type === "url" ? { link: content.source.url } : { id: content.source.id };
      if (content.caption) mediaPayload.caption = content.caption;
      if (content.filename && content.mediaKind === "document") {
        mediaPayload.filename = content.filename;
      }
      body = {
        messaging_product: "whatsapp",
        to: message.to,
        type: content.mediaKind,
        [content.mediaKind]: mediaPayload,
      };
    }
    const res = await this.fetchImpl(`${this.apiBase}/${this.config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Meta sendMessage failed: HTTP ${res.status} ${await res.text()}`);
    }
    const parsed = z
      .looseObject({ messages: z.array(z.looseObject({ id: z.string() })).optional() })
      .parse(await res.json());
    return { externalId: parsed.messages?.[0]?.id ?? "", status: "sent" };
  }

  verifyWebhook(request: RawWebhookRequest): boolean {
    const header = request.headers["x-hub-signature-256"];
    if (!header?.startsWith("sha256=")) return false;
    return verifyHmacSignature({
      algorithm: "sha256",
      secret: this.config.appSecret,
      payload: request.rawBody,
      signatureHex: header.slice("sha256=".length),
    });
  }

  /** Meta webhook subscription handshake (GET ?hub.mode&hub.verify_token&hub.challenge). */
  verificationChallenge(query: Record<string, string>): string | null {
    if (
      query["hub.mode"] === "subscribe" &&
      query["hub.verify_token"] === this.config.verifyToken
    ) {
      return query["hub.challenge"] ?? null;
    }
    return null;
  }

  parseWebhook(request: RawWebhookRequest): ChannelEvent[] {
    let raw: unknown;
    try {
      raw = JSON.parse(request.rawBody);
    } catch {
      return [];
    }
    const parsed = webhookSchema.safeParse(raw);
    if (!parsed.success) return [];
    const events: ChannelEvent[] = [];
    for (const entry of parsed.data.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const raw of change.value.messages ?? []) {
          const msg = metaMessageSchema.safeParse(raw);
          if (!msg.success) continue;
          events.push(metaMessageToEvent(msg.data));
        }
        for (const raw of change.value.statuses ?? []) {
          const status = metaStatusSchema.safeParse(raw);
          if (!status.success) continue;
          const mapped = mapStatus(status.data.status);
          if (!mapped) continue;
          events.push({
            type: "message.status",
            externalMessageId: status.data.id,
            status: mapped,
            timestamp: new Date(Number(status.data.timestamp ?? 0) * 1000),
          });
        }
      }
    }
    return events;
  }
}

function mapStatus(status: string): "sent" | "delivered" | "read" | "failed" | null {
  if (status === "sent" || status === "delivered" || status === "read" || status === "failed") {
    return status;
  }
  return null;
}

function metaMessageToEvent(msg: z.infer<typeof metaMessageSchema>): ChannelEvent {
  const content = metaContent(msg);
  return {
    type: "message.received",
    externalMessageId: msg.id,
    from: { channelUserId: msg.from },
    content,
    timestamp: new Date(Number(msg.timestamp) * 1000),
  };
}

function metaContent(msg: z.infer<typeof metaMessageSchema>): MessageContent {
  if (msg.type !== "text" && (msg.image ?? msg.video ?? msg.audio ?? msg.document)) {
    if (msg.image) {
      return {
        type: "media",
        mediaKind: "image",
        source: { type: "provider", id: msg.image.id },
        ...(msg.image.mime_type ? { mimeType: msg.image.mime_type } : {}),
        ...(msg.image.caption ? { caption: msg.image.caption } : {}),
      };
    }
    if (msg.video) {
      return {
        type: "media",
        mediaKind: "video",
        source: { type: "provider", id: msg.video.id },
        ...(msg.video.mime_type ? { mimeType: msg.video.mime_type } : {}),
        ...(msg.video.caption ? { caption: msg.video.caption } : {}),
      };
    }
    if (msg.audio) {
      return {
        type: "media",
        mediaKind: "audio",
        source: { type: "provider", id: msg.audio.id },
        ...(msg.audio.mime_type ? { mimeType: msg.audio.mime_type } : {}),
      };
    }
    const doc = msg.document;
    if (doc) {
      return {
        type: "media",
        mediaKind: "document",
        source: { type: "provider", id: doc.id },
        ...(doc.mime_type ? { mimeType: doc.mime_type } : {}),
        ...(doc.caption ? { caption: doc.caption } : {}),
        ...(doc.filename ? { filename: doc.filename } : {}),
      };
    }
  }
  return { type: "text", text: msg.text?.body ?? "" };
}
