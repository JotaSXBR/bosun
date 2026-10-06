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
  ExternalChat,
  InboundChannelMessage,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
  ServerInfo,
  SessionInfo,
} from "../domain";
import type { ChannelProvider } from "../provider";
import { verifyHmacSignature } from "../shared/hmac";
import type { FetchLike, WahaConfig } from "./waha-payloads";
import {
  mapSessionStatus,
  WAHA_WEBHOOK_EVENTS,
  WAHA_WEBHOOK_RETRIES,
  wahaAckToEvents,
  wahaChatSchema,
  wahaMeSchema,
  wahaMessageSchema,
  wahaMessageToEvents,
  wahaPairingCodeSchema,
  wahaServerVersionSchema,
  wahaSessionSchema,
  wahaSessionStatusToEvents,
  wahaToInbound,
  wahaWebhookSchema,
} from "./waha-payloads";

export type { FetchLike, WahaConfig } from "./waha-payloads";
export { WAHA_WEBHOOK_EVENTS, WAHA_WEBHOOK_RETRIES } from "./waha-payloads";

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

  /**
   * Session `config` for create/update — the per-connection webhook with
   * HMAC + retries. Undefined when no webhookUrl is configured (never send
   * an empty config: PUT is a full replace and would wipe the session's
   * webhooks).
   */
  private webhookSessionConfig(): { webhooks: Record<string, unknown>[] } | undefined {
    if (!this.config.webhookUrl) return undefined;
    const webhook: Record<string, unknown> = {
      url: this.config.webhookUrl,
      events: [...WAHA_WEBHOOK_EVENTS],
      retries: { ...WAHA_WEBHOOK_RETRIES },
    };
    if (this.config.webhookHmacKey) {
      webhook.hmac = { key: this.config.webhookHmacKey };
    }
    return { webhooks: [webhook] };
  }

  /** Idempotent config write — PUT is a FULL replace, send the whole config. */
  private async writeSessionConfig(config: { webhooks: Record<string, unknown>[] }): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/sessions/${this.config.session}`, {
      method: "PUT",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name: this.config.session, config }),
    });
    if (!res.ok) {
      throw new Error(`WAHA update session config failed: HTTP ${res.status}`);
    }
  }

  async connect(): Promise<ConnectResult> {
    const existing = await this.getSession();
    const config = this.webhookSessionConfig();
    if (!existing) {
      const created = await this.fetchImpl(`${this.baseUrl}/api/sessions`, {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: this.config.session,
          start: true,
          ...(config ? { config } : {}),
        }),
      });
      if (!created.ok) {
        throw new Error(`WAHA create session failed: HTTP ${created.status}`);
      }
    } else {
      // Re-register the webhook on existing sessions — PUT is idempotent
      // with our desired state (and covers sessions created before
      // webhookUrl existed).
      if (config) await this.writeSessionConfig(config);
      if (existing.status === "STOPPED" || existing.status === "FAILED") {
        const started = await this.fetchImpl(
          `${this.baseUrl}/api/sessions/${this.config.session}/start`,
          { method: "POST", headers: this.headers() },
        );
        if (!started.ok) {
          throw new Error(`WAHA start session failed: HTTP ${started.status}`);
        }
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

  async restart(): Promise<void> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/sessions/${this.config.session}/restart`,
      {
        method: "POST",
        headers: this.headers(),
      },
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA restart session failed: HTTP ${res.status}`);
    }
  }

  /** Unpairs the device — next connect() will need QR/pairing code again. */
  async logout(): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/sessions/${this.config.session}/logout`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA logout session failed: HTTP ${res.status}`);
    }
  }

  /** WhatsApp "connect with phone number" — the code the user types in the app. */
  async requestPairingCode(phoneNumber: string): Promise<{ code: string }> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/${this.config.session}/auth/request-code`,
      {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ phoneNumber }),
      },
    );
    if (!res.ok) {
      throw new Error(`WAHA request pairing code failed: HTTP ${res.status}`);
    }
    return wahaPairingCodeSchema.parse(await res.json());
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const session = await this.getSession();
    const status = mapSessionStatus(session?.status ?? "STOPPED");
    const info: SessionInfo = { status, warnings: [] };
    const res = await this.fetchImpl(`${this.baseUrl}/api/sessions/${this.config.session}/me`, {
      headers: this.headers(),
    });
    if (!res.ok) return info;
    const me = wahaMeSchema.parse(await res.json());
    if (me.id) info.phone = me.id.split("@")[0];
    if (me.pushName) info.pushName = me.pushName;
    if (me.reachoutTimelock) info.warnings.push("reachout_timelock");
    const capping = me.messageCapping?.state;
    if (capping && capping !== "NONE") {
      info.warnings.push(`message_capping:${capping.toLowerCase()}`);
    }
    return info;
  }

  async getServerInfo(): Promise<ServerInfo> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/server/version`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`WAHA server version failed: HTTP ${res.status}`);
    }
    const parsed = wahaServerVersionSchema.parse(await res.json());
    return { version: parsed.version, engine: parsed.engine ?? "unknown", tier: parsed.tier };
  }

  /** 1:1 chats only — groups (@g.us), broadcasts and newsletters are skipped. */
  async listChats(opts?: { limit?: number; offset?: number }): Promise<ExternalChat[]> {
    const params = new URLSearchParams({
      limit: String(opts?.limit ?? 100),
      offset: String(opts?.offset ?? 0),
    });
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/${this.config.session}/chats/overview?${params.toString()}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error(`WAHA list chats failed: HTTP ${res.status}`);
    }
    const chats = z.array(wahaChatSchema).parse(await res.json());
    return chats
      .filter(
        (chat) =>
          !chat.id.endsWith("@g.us") &&
          !chat.id.endsWith("@broadcast") &&
          !chat.id.endsWith("@newsletter"),
      )
      .map((chat) => ({
        id: chat.id,
        ...(chat.name ? { name: chat.name } : {}),
        ...(chat.lastMessage?.timestamp
          ? { lastMessageAt: new Date(chat.lastMessage.timestamp * 1000) }
          : {}),
      }));
  }

  /** Backfill source — same message mapping as live webhooks. */
  async listMessages(
    chatId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<InboundChannelMessage[]> {
    const params = new URLSearchParams({
      chatId,
      limit: String(opts?.limit ?? 100),
      offset: String(opts?.offset ?? 0),
      session: this.config.session,
    });
    const res = await this.fetchImpl(`${this.baseUrl}/api/messages?${params.toString()}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`WAHA list messages failed: HTTP ${res.status}`);
    }
    const rows = z.array(z.unknown()).parse(await res.json());
    const messages: InboundChannelMessage[] = [];
    for (const row of rows) {
      const message = wahaMessageSchema.safeParse(row);
      if (!message.success || message.data.fromMe) continue;
      messages.push(wahaToInbound(message.data));
    }
    return messages;
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

    switch (event) {
      case "message":
        return wahaMessageToEvents(payload, timestamp);
      case "message.ack":
        return wahaAckToEvents(payload, timestamp);
      case "session.status":
        return wahaSessionStatusToEvents(payload);
      default:
        return [];
    }
  }
}
