// Test-only provider — used through the ChannelProvider interface so tests
// exercise the real contract.
import type {
  ChannelEvent,
  ChannelProviderKind,
  ConnectionStatus,
  ConnectResult,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
} from "./domain";
import type { ChannelProvider } from "./provider";
import { verifyHmacSignature } from "./shared/hmac";

export class FakeChannelProvider implements ChannelProvider {
  readonly kind: ChannelProviderKind;
  readonly capabilities = { qrCodeConnect: true, media: true };

  sentMessages: OutboundMessage[] = [];
  queuedEvents: ChannelEvent[] = [];
  connected = false;
  statusOverride: ConnectionStatus | null = null;
  nextExternalId = "fake-msg-1";
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

  getConnectionStatus(): Promise<ConnectionStatus> {
    return Promise.resolve(this.statusOverride ?? (this.connected ? "connected" : "disconnected"));
  }

  sendMessage(message: OutboundMessage): Promise<SendMessageResult> {
    this.sentMessages.push(message);
    return Promise.resolve({ externalId: this.nextExternalId, status: "sent" });
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
