// WAHA (WhatsApp HTTP API, devlikeapro/waha) adapter.
// Verified against https://waha.devlike.pro/docs (sessions, send-messages,
// events). Auth: `X-Api-Key` header. Webhooks: `X-Webhook-Hmac` = sha512 hex
// of the raw body (header `X-Webhook-Hmac-Algorithm: sha512`); HMAC is
// configured per webhook with `hmac.key` — we treat it as mandatory, so
// verifyWebhook returns false when no key is configured.
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
import { verifyHmacSignature } from "../shared/hmac";

export type WahaConfig = {
  baseUrl: string;
  apiKey: string;
  session: string;
  webhookHmacKey?: string | undefined;
};

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

const wahaSessionSchema = z.looseObject({
  name: z.string(),
  status: z.string(),
});

const wahaWebhookSchema = z.looseObject({
  event: z.string(),
  session: z.string().optional(),
  timestamp: z.number().optional(),
  payload: z.unknown(),
});

const wahaMessageSchema = z.looseObject({
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

const wahaAckSchema = z.looseObject({
  id: z.string(),
  ack: z.number(),
});

const wahaSessionStatusSchema = z.looseObject({
  status: z.string(),
});

function mapSessionStatus(status: string): ConnectionStatus {
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

export class WahaChannelProvider implements ChannelProvider {
  readonly kind = "waha" as const;
  readonly capabilities = { qrCodeConnect: true, media: true };

  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly config: WahaConfig,
    deps?: { fetch?: FetchLike },
  ) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = deps?.fetch ?? fetch;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return { "X-Api-Key": this.config.apiKey, ...extra };
  }

  private async getSession(): Promise<z.infer<typeof wahaSessionSchema> | null> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/sessions/${this.config.session}`, {
      headers: this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WAHA get session failed: HTTP ${res.status}`);
    return wahaSessionSchema.parse(await res.json());
  }

  async connect(): Promise<ConnectResult> {
    const existing = await this.getSession();
    if (!existing) {
      // Create + start; webhook config (incl. hmac.key) lives on the session
      // config — the caller passes it via WAHA session setup; we only manage
      // lifecycle here.
      const created = await this.fetchImpl(`${this.baseUrl}/api/sessions`, {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: this.config.session, start: true }),
      });
      if (!created.ok) {
        throw new Error(`WAHA create session failed: HTTP ${created.status}`);
      }
    } else if (existing.status === "STOPPED" || existing.status === "FAILED") {
      const started = await this.fetchImpl(
        `${this.baseUrl}/api/sessions/${this.config.session}/start`,
        { method: "POST", headers: this.headers() },
      );
      if (!started.ok) {
        throw new Error(`WAHA start session failed: HTTP ${started.status}`);
      }
    }

    const session = await this.getSession();
    const status = mapSessionStatus(session?.status ?? "FAILED");
    const result: ConnectResult = { status };
    if (session?.status === "SCAN_QR_CODE") {
      result.qrCode = await this.getQrCode();
    }
    return result;
  }

  private async getQrCode(): Promise<ConnectResult["qrCode"]> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/${this.config.session}/auth/qr`, {
      headers: this.headers({ Accept: "application/json" }),
    });
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = z
        .looseObject({ mimetype: z.string().optional(), data: z.string().optional() })
        .parse(await res.json());
      if (!body.data) return undefined;
      return { mimeType: body.mimetype ?? "image/png", data: body.data };
    }
    const buffer = await res.arrayBuffer();
    return {
      mimeType: contentType || "image/png",
      data: Buffer.from(buffer).toString("base64"),
    };
  }

  async disconnect(): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/sessions/${this.config.session}/stop`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA stop session failed: HTTP ${res.status}`);
    }
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    const session = await this.getSession();
    return mapSessionStatus(session?.status ?? "STOPPED");
  }

  async sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    const { content } = message;
    let path: string;
    let body: Record<string, unknown>;
    if (content.type === "text") {
      path = "/api/sendText";
      body = { session: this.config.session, chatId: message.to, text: content.text };
    } else {
      if (content.source.type !== "url") {
        throw new Error("WAHA adapter only supports media by URL");
      }
      const endpoint =
        content.mediaKind === "image"
          ? "/api/sendImage"
          : content.mediaKind === "video"
            ? "/api/sendVideo"
            : "/api/sendFile"; // audio + documents go through sendFile
      path = endpoint;
      body = {
        session: this.config.session,
        chatId: message.to,
        file: {
          mimetype: content.mimeType,
          filename: content.filename,
          url: content.source.url,
        },
        caption: content.caption,
      };
    }
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`WAHA sendMessage failed: HTTP ${res.status} ${await res.text()}`);
    }
    const parsed = z.looseObject({ id: z.string().optional() }).parse(await res.json());
    return { externalId: parsed.id ?? "", status: "sent" };
  }

  verifyWebhook(request: RawWebhookRequest): boolean {
    // HMAC is mandatory for us — never trust an unsigned webhook.
    const key = this.config.webhookHmacKey;
    if (!key) return false;
    const signature = request.headers["x-webhook-hmac"];
    if (!signature) return false;
    const algorithm = request.headers["x-webhook-hmac-algorithm"] ?? "sha512";
    if (algorithm !== "sha512") return false;
    return verifyHmacSignature({
      algorithm: "sha512",
      secret: key,
      payload: request.rawBody,
      signatureHex: signature,
    });
  }

  parseWebhook(request: RawWebhookRequest): ChannelEvent[] {
    let raw: unknown;
    try {
      raw = JSON.parse(request.rawBody);
    } catch {
      return [];
    }
    const parsed = wahaWebhookSchema.safeParse(raw);
    if (!parsed.success) return [];
    const { event, timestamp, payload } = parsed.data;

    if (event === "message") {
      const message = wahaMessageSchema.safeParse(payload);
      if (!message.success || message.data.fromMe) return [];
      const data = message.data;
      return [
        {
          type: "message.received",
          externalMessageId: data.id,
          from: {
            channelUserId: data.from,
            ...(data.notifyName ? { displayName: data.notifyName } : {}),
          },
          content: data.hasMedia
            ? {
                type: "media",
                mediaKind: "document",
                source: { type: "url", url: data.mediaUrl ?? "" },
                ...(data.mimetype ? { mimeType: data.mimetype } : {}),
                ...(data.filename ? { filename: data.filename } : {}),
                ...(data.body ? { caption: data.body } : {}),
              }
            : { type: "text", text: data.body ?? "" },
          timestamp: new Date((data.timestamp ?? timestamp ?? 0) * 1000),
        },
      ];
    }

    if (event === "message.ack") {
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

    if (event === "session.status") {
      const session = wahaSessionStatusSchema.safeParse(payload);
      if (!session.success) return [];
      return [{ type: "connection.status", status: mapSessionStatus(session.data.status) }];
    }

    return [];
  }
}
