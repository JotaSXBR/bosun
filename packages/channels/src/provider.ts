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
  /**
   * WAHA-only pairing code (WhatsApp "connect with phone number").
   * Undefined on providers without pairing support.
   */
  requestPairingCode?(phoneNumber: string): Promise<{ code: string }>;
  /** Live session details — paired phone, display name, restriction warnings. */
  getSessionInfo?(): Promise<SessionInfo>;
  /** Server build info for the health card (version/engine). */
  getServerInfo?(): Promise<ServerInfo>;
  /** Chats visible to the session — used by the message reconciler. */
  listChats?(opts?: { limit?: number; offset?: number }): Promise<ExternalChat[]>;
  /** Recent messages of a chat — backfill source for the reconciler. */
  listMessages?(
    chatId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<InboundChannelMessage[]>;
  /** Unpair the session (WAHA logout) — next connect requires QR again. */
  logout?(): Promise<void>;
  /** Restart a session in place (keeps pairing). */
  restart?(): Promise<void>;
}
