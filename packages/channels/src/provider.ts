import type {
  ChannelEvent,
  ChannelProviderKind,
  ConnectionStatus,
  ConnectResult,
  OutboundMessage,
  RawWebhookRequest,
  SendMessageResult,
} from "./domain";

/**
 * The only contract the CRM knows about messaging providers.
 * Implementations live in src/adapters/*; routing code uses this interface and
 * never sees provider-specific shapes. Keep it minimal — do not add methods
 * without a real consumer.
 */
export interface ChannelProvider {
  readonly kind: ChannelProviderKind;
  readonly capabilities: { qrCodeConnect: boolean; media: boolean };
  connect(): Promise<ConnectResult>;
  disconnect(): Promise<void>;
  getConnectionStatus(): Promise<ConnectionStatus>;
  sendMessage(message: OutboundMessage): Promise<SendMessageResult>;
  /**
   * Cheap, side-effect-free authenticity check on the raw request.
   * Always verify before parseWebhook.
   */
  verifyWebhook(request: RawWebhookRequest): boolean;
  /** Normalizes provider payloads into domain events; unknown events → []. */
  parseWebhook(request: RawWebhookRequest): ChannelEvent[];
  /** Webhook subscription handshake (Meta GET challenge). Returns null when not applicable. */
  verificationChallenge?(query: Record<string, string>): string | null;
}
