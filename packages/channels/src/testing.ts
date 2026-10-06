// Test-only provider — used through the ChannelProvider interface so tests
// exercise the real contract.
import type {
  ChannelEvent,
  ChannelProviderKind,
  ConnectionStatus,
  ConnectResult,
  ExternalChat,
  InboundChannelMessage,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
  ServerInfo,
  SessionInfo,
} from "./domain";
import type { ChannelProvider } from "./provider";
import { verifyHmacSignature } from "./shared/hmac";

/** Process-wide counter — ids stay unique across provider instances, like real external ids. */
let nextFakeMessageId = 0;

export class FakeChannelProvider implements ChannelProvider {
  readonly kind: ChannelProviderKind;
  readonly capabilities = { qrCodeConnect: true, media: true };

  sentMessages: OutboundMessage[] = [];
  queuedEvents: ChannelEvent[] = [];
  connected = false;
  statusOverride: ConnectionStatus | null = null;
  /** Pin a specific id; unset → unique fake-msg-N like a real provider. */
  nextExternalId: string | undefined;
  /** When set, sendMessage rejects with it — exercises the failed-send path. */
  sendMessageError: Error | null = null;
  webhookSecret: string | undefined;

  constructor(kind: ChannelProviderKind = "waha", webhookSecret?: string) {
    this.kind = kind;
    this.webhookSecret = webhookSecret;
  }

  connect(): Promise<ConnectResult> {
    this.connected = true;
    return Promise.resolve({ status: "connected" });
  }

  disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  restart(): Promise<void> {
    return Promise.resolve();
  }

  logout(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  requestPairingCode(): Promise<{ code: string }> {
    return Promise.resolve({ code: this.pairingCode });
  }

  pairingCode = "ABCD-ABCD";
  sessionInfo: SessionInfo = { status: "connected", warnings: [] };
  serverInfo: ServerInfo = { version: "0.0.0-fake", engine: "GOWS" };
  chats: ExternalChat[] = [];
  messagesByChat: Record<string, InboundChannelMessage[]> = {};

  getSessionInfo(): Promise<SessionInfo> {
    return Promise.resolve(this.sessionInfo);
  }

  getServerInfo(): Promise<ServerInfo> {
    return Promise.resolve(this.serverInfo);
  }

  listChats(): Promise<ExternalChat[]> {
    return Promise.resolve(this.chats);
  }

  listMessages(chatId: string): Promise<InboundChannelMessage[]> {
    return Promise.resolve(this.messagesByChat[chatId] ?? []);
  }

  getConnectionStatus(): Promise<ConnectionStatus> {
    return Promise.resolve(this.statusOverride ?? (this.connected ? "connected" : "disconnected"));
  }

  sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    if (this.sendMessageError) return Promise.reject(this.sendMessageError);
    this.sentMessages.push(message);
    const externalId = this.nextExternalId ?? `fake-msg-${++nextFakeMessageId}`;
    return Promise.resolve({ externalId, status: "sent" });
  }

  verifyWebhook(request: RawWebhookRequest): boolean {
    if (!this.webhookSecret) return false;
    const signature = request.headers["x-webhook-hmac"] ?? "";
    return verifyHmacSignature({
      algorithm: "sha512",
      secret: this.webhookSecret,
      payload: request.rawBody,
      signatureHex: signature,
    });
  }

  parseWebhook(): ChannelEvent[] {
    const events = this.queuedEvents;
    this.queuedEvents = [];
    return events;
  }
}
