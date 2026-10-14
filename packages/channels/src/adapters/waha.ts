// WAHA (WhatsApp HTTP API, devlikeapro/waha) adapter — lifecycle + webhooks
// here; outbound chat actions in waha-actions.ts, payloads in
// waha-payloads.ts. Auth: X-Api-Key; webhook HMAC (sha512) is mandatory.
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
import type { WahaRequest } from "./waha-actions";
import {
  wahaDeleteMessage,
  wahaEditMessage,
  wahaFetchMedia,
  wahaFetchMessageMediaRef,
  wahaSendMessage,
  wahaSendPresence,
  wahaSendReaction,
  wahaSendSeen,
  wahaSubscribePresence,
} from "./waha-actions";
import type { FetchLike, WahaConfig } from "./waha-payloads";
import {
  mapSessionStatus,
  WAHA_WEBHOOK_EVENTS,
  WAHA_WEBHOOK_RETRIES,
  wahaAckToEvents,
  wahaChatSchema,
  wahaEditedToEvents,
  wahaMeSchema,
  wahaMessageSchema,
  wahaMessageToEvents,
  wahaPairingCodeSchema,
  wahaPresenceToEvents,
  wahaReactionToEvents,
  wahaRevokedToEvents,
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
    const res = await this.request(`/api/sessions/${this.config.session}`);
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
    const res = await this.request(`/api/sessions/${this.config.session}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: this.config.session, config }),
    });
    if (!res.ok) {
      throw new Error(`WAHA update session config failed: HTTP ${res.status}`);
    }
  }

  async connect(): Promise<ConnectResult> {
    const existing = await this.getSession();
    const config = this.webhookSessionConfig();
    if (!existing) await this.createSession(config);
    else await this.updateSession(existing, config);

    const session = await this.getSession();
    const status = mapSessionStatus(session?.status ?? "FAILED");
    const result: ConnectResult = { status };
    if (session?.status === "SCAN_QR_CODE") {
      result.qrCode = await this.getQrCode();
    }
    return result;
  }

  private async createSession(
    config: { webhooks: Record<string, unknown>[] } | undefined,
  ): Promise<void> {
    const created = await this.request(`/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: this.config.session,
        start: true,
        ...(config ? { config } : {}),
      }),
    });
    if (!created.ok) {
      throw new Error(`WAHA create session failed: HTTP ${created.status}`);
    }
  }

  private async updateSession(
    existing: z.infer<typeof wahaSessionSchema>,
    config: { webhooks: Record<string, unknown>[] } | undefined,
  ): Promise<void> {
    // A config PUT restarts the session — rewriting it on every connect
    // poll keeps the session bouncing STARTING↔SCAN_QR_CODE and the QR
    // is never fetched. Skip when our webhook is already registered or
    // the session is mid-pairing (config necessarily got there with it).
    const webhookRegistered = existing.config?.webhooks?.some(
      (hook) => hook.url === this.config.webhookUrl,
    );
    if (config && !webhookRegistered && existing.status !== "SCAN_QR_CODE") {
      await this.writeSessionConfig(config);
    }
    if (existing.status === "STOPPED" || existing.status === "FAILED") {
      const started = await this.request(`/api/sessions/${this.config.session}/start`, {
        method: "POST",
      });
      if (!started.ok) {
        throw new Error(`WAHA start session failed: HTTP ${started.status}`);
      }
    }
  }

  private async getQrCode(): Promise<ConnectResult["qrCode"]> {
    const res = await this.request(`/api/${this.config.session}/auth/qr`, {
      headers: { Accept: "application/json" },
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
    const res = await this.request(`/api/sessions/${this.config.session}/stop`, {
      method: "POST",
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA stop session failed: HTTP ${res.status}`);
    }
  }

  async restart(): Promise<void> {
    const res = await this.request(`/api/sessions/${this.config.session}/restart`, {
      method: "POST",
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA restart session failed: HTTP ${res.status}`);
    }
  }

  /** Unpairs the device — next connect() will need QR/pairing code again. */
  async logout(): Promise<void> {
    const res = await this.request(`/api/sessions/${this.config.session}/logout`, {
      method: "POST",
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`WAHA logout session failed: HTTP ${res.status}`);
    }
  }

  /** WhatsApp "connect with phone number" — the code the user types in the app. */
  async requestPairingCode(phoneNumber: string): Promise<{ code: string }> {
    const res = await this.request(`/api/${this.config.session}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) {
      throw new Error(`WAHA request pairing code failed: HTTP ${res.status}`);
    }
    return wahaPairingCodeSchema.parse(await res.json());
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const session = await this.getSession();
    const status = mapSessionStatus(session?.status ?? "STOPPED");
    const info: SessionInfo = { status, warnings: [] };
    const res = await this.request(`/api/sessions/${this.config.session}/me`);
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
    const res = await this.request(`/api/server/version`);
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
    const res = await this.request(
      `/api/${this.config.session}/chats/overview?${params.toString()}`,
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
    const res = await this.request(`/api/messages?${params.toString()}`);
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

  /** fetch bound to baseUrl + X-Api-Key; absolute media URLs pass through. */
  private readonly request: WahaRequest = (path, init) =>
    this.fetchImpl(path.startsWith("http") ? path : `${this.baseUrl}${path}`, {
      ...init,
      headers: this.headers(init?.headers),
    });

  sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    return wahaSendMessage(this.request, this.config.session, message);
  }

  sendSeen(chatId: string): Promise<void> {
    return wahaSendSeen(this.request, this.config.session, chatId);
  }

  sendPresence(chatId: string, presence: "typing" | "recording" | "paused"): Promise<void> {
    return wahaSendPresence(this.request, this.config.session, chatId, presence);
  }

  subscribePresence(chatId: string): Promise<void> {
    return wahaSubscribePresence(this.request, this.config.session, chatId);
  }

  sendReaction(messageExternalId: string, emoji: string): Promise<void> {
    return wahaSendReaction(this.request, this.config.session, messageExternalId, emoji);
  }

  editMessage(chatId: string, messageExternalId: string, text: string): Promise<void> {
    return wahaEditMessage(this.request, this.config.session, { chatId, messageExternalId }, text);
  }

  deleteMessage(chatId: string, messageExternalId: string): Promise<void> {
    return wahaDeleteMessage(this.request, this.config.session, { chatId, messageExternalId });
  }

  /**
   * Resolves a provider-stamped media url to a safe absolute target on the
   * WAHA host. GOWS may emit relative media paths — resolve them on
   * baseUrl. media.url is provider-generated, but the api key must never
   * leave the WAHA host: same-origin passes as-is; a foreign /api/files/*
   * path is the same file on the trusted host (WAHA stamps its own
   * WAHA_BASE_URL, default http://localhost:3000) so re-root
   * pathname+search; anything else is refused. Origin check (not prefix):
   * "http://waha@evil" or "http://waha.evil" would pass a startsWith test
   * and leak X-Api-Key.
   */
  private resolveMediaUrl(url: string): string {
    const absolute = url.startsWith("/") ? `${this.baseUrl}${url}` : url;
    try {
      const parsed = new URL(absolute);
      const sameOrigin = parsed.origin === new URL(this.baseUrl).origin;
      if (!sameOrigin && !parsed.pathname.startsWith("/api/files/")) {
        throw new Error("WAHA fetchMedia refused: url outside the WAHA host");
      }
      return sameOrigin ? absolute : `${this.baseUrl}${parsed.pathname}${parsed.search}`;
    } catch {
      throw new Error("WAHA fetchMedia refused: url outside the WAHA host");
    }
  }

  async fetchMedia(url: string): Promise<{ body: Uint8Array; contentType: string | null }> {
    return wahaFetchMedia(this.request, this.resolveMediaUrl(url));
  }

  /**
   * Fallback for inbound media whose stored url isn't fetchable — sticker
   * payloads carry the WhatsApp CDN .enc blob, not a local path. Asks WAHA
   * to download the message's media on demand, then tries what the
   * response offers, in order:
   *  1. media.url through the origin guard (local /api/files/* paths and
   *     same-origin urls pass; foreign /api/files/* re-roots onto baseUrl)
   *  2. media.url anonymous — WAHA_MEDIA_STORAGE=s3 with S3 proxy off
   *     stamps a pre-signed https url, fetchable without the api key
   *  3. /api/files/{session}/{filename|messageId.ext} — MediaLocalStorage
   *     keeps files under a per-session directory
   * The WhatsApp CDN (*.whatsapp.net .enc blobs) is never fetched — the
   * bytes are encrypted and useless anyway.
   */
  async fetchMessageMedia(
    chatId: string,
    messageId: string,
  ): Promise<{ body: Uint8Array; contentType: string | null } | null> {
    const ref = await wahaFetchMessageMediaRef(this.request, this.config.session, {
      chatId,
      messageExternalId: messageId,
    });
    if (!ref) return null;
    const attempts: Array<() => Promise<{ body: Uint8Array; contentType: string | null }>> = [];
    const mediaUrl = ref.url;
    if (mediaUrl) {
      attempts.push(() => wahaFetchMedia(this.request, this.resolveMediaUrl(mediaUrl)));
      if (WahaChannelProvider.isAnonymousFetchable(mediaUrl)) {
        attempts.push(() => this.fetchAnonymousMedia(mediaUrl));
      }
    }
    for (const path of this.mediaFilePaths(ref.filename, messageId)) {
      attempts.push(() => wahaFetchMedia(this.request, this.resolveMediaUrl(path)));
    }
    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
      }
    }
    const detail = lastError instanceof Error ? ` — last: ${lastError.message}` : "";
    throw new Error(
      `WAHA fetchMessageMedia: no downloadable media${ref.error ? ` (${ref.error})` : ""}${detail}`,
    );
  }

  /**
   * https urls on non-WhatsApp hosts may be pre-signed media (S3/MinIO)
   * — safe to fetch anonymously: the url is stamped by WAHA's own media
   * layer, and the api key must never ride along. *.whatsapp.net hosts are
   * the encrypted CDN — skipped, the blob is undecryptable here anyway.
   */
  private static isAnonymousFetchable(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      const host = parsed.hostname;
      return host !== "whatsapp.net" && !host.endsWith(".whatsapp.net");
    } catch {
      return false;
    }
  }

  private async fetchAnonymousMedia(
    url: string,
  ): Promise<{ body: Uint8Array; contentType: string | null }> {
    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`WAHA fetchMedia failed: HTTP ${res.status}`);
    return {
      body: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type"),
    };
  }

  /**
   * Candidate /api/files paths for a downloaded message. WAHA's local
   * storage layout is {session}/{messageId}.{ext} — media.filename is the
   * original WhatsApp filename and may differ, so both the filename and
   * the bare message id (last segment of the serialized externalId) are
   * tried under the session directory, then the flat path.
   */
  private mediaFilePaths(filename: string | null, messageId: string): string[] {
    const paths: string[] = [];
    const session = this.config.session;
    const bareId = messageId.split("_").pop();
    const ext = filename?.match(/\.[a-z0-9]+$/i)?.[0];
    if (filename) {
      paths.push(`/api/files/${session}/${encodeURIComponent(filename)}`);
    }
    if (bareId && ext) {
      paths.push(`/api/files/${session}/${encodeURIComponent(`${bareId}${ext}`)}`);
    }
    if (filename) {
      paths.push(`/api/files/${encodeURIComponent(filename)}`);
    }
    return [...new Set(paths)];
  }

  /**
   * Two hops: WAHA resolves the WhatsApp CDN URL, then a plain anonymous
   * fetch downloads it. `request` would attach X-Api-Key — the key must
   * never leave the WAHA host, so the second hop uses raw fetch.
   */
  async fetchContactAvatar(
    channelUserId: string,
  ): Promise<{ body: Uint8Array; contentType: string | null } | null> {
    const res = await this.request(
      `/api/contacts/profile-picture?session=${encodeURIComponent(this.config.session)}&contactId=${encodeURIComponent(channelUserId)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WAHA profile-picture failed: HTTP ${res.status}`);
    const parsed = z
      .looseObject({ profilePictureURL: z.string().nullish() })
      .parse(await res.json());
    const url = parsed.profilePictureURL;
    if (!url?.startsWith("https://")) return null;
    const img = await this.fetchImpl(url);
    if (!img.ok) return null;
    return {
      body: new Uint8Array(await img.arrayBuffer()),
      contentType: img.headers.get("content-type"),
    };
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
      case "message.reaction":
        return wahaReactionToEvents(payload);
      case "message.edited":
        return wahaEditedToEvents(payload);
      case "message.revoked":
        return wahaRevokedToEvents(payload);
      case "presence.update":
        return wahaPresenceToEvents(payload);
      case "session.status":
        return wahaSessionStatusToEvents(payload);
      default:
        return [];
    }
  }
}
