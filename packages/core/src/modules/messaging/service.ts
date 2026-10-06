import type { ChannelEvent, RawWebhookRequest } from "@crm/channels";
import { applyConnectionStatus, resolveWebhookConnection } from "@crm/core/integrations";
import type { Database, DbExecutor } from "@crm/db";
import { emitDomainEvent, schema, withTenant } from "@crm/db";
import { eq } from "drizzle-orm";

import { NotFoundError, WebhookVerificationError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { ConversationDetailRow, ConversationListRow, MessageWithAuthorRow } from "./reads";
import {
  getConversationDetail as repoGetConversationDetail,
  listConversations,
  listMessages,
} from "./reads";
import {
  applyInboundStatusTransition,
  applyMessageEdit,
  findActiveTicket,
  findMessageByExternalIds,
  findOrCreateTicket,
  insertMessage,
  markMessageRevoked,
  updateConversationLastMessage,
  updateMessageStatus,
  upsertContact,
  upsertMessageReaction,
} from "./repository";
import type { ConversationIdInput, ListConversationsInput, ListMessagesInput } from "./schemas";
import { conversationIdInput, listConversationsInput, listMessagesInput } from "./schemas";

const { conversations } = schema;

/**
 * Minimal connection identity needed for ingestion. The row was already
 * authenticated (unguessable webhook token + provider signature) before any
 * event reaches here.
 */
export type ConnectionRef = {
  id: string;
  organizationId: string;
  kind: string;
};

export type IngestedEvent = {
  eventType: ChannelEvent["type"];
  /** Set when the event created/updated a message row. */
  messageId: string | null;
};

export type WebhookIngestResult = {
  organizationId: string;
  channelConnectionId: string;
  processed: IngestedEvent[];
};

/**
 * Job enqueue callback injected by the app layer (`@crm/automation` lives
 * above core — dependency direction forbids importing it here). Called with
 * the ingest transaction so the job row commits atomically with the write.
 */
export type ChannelEventEnqueue = (
  executor: DbExecutor,
  payload: {
    organizationId: string;
    channelConnectionId: string;
    eventType: ChannelEvent["type"];
    conversationId?: string;
    messageId?: string;
  },
) => Promise<unknown>;

export type IngestDeps = { enqueue?: ChannelEventEnqueue };

/**
 * Pure domain ingest — no HTTP. Runs inside the caller's withTenant
 * transaction. `conn` identity always comes from the stored connection row,
 * never from the event payload.
 */
async function ingestMessageReceived(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "message.received" }>,
  deps?: IngestDeps,
): Promise<IngestedEvent> {
  const contact = await upsertContact(executor, conn.organizationId, {
    channelUserId: event.from.channelUserId,
    displayName: event.from.displayName,
  });
  const { conversation, created } = await findOrCreateTicket(executor, {
    organizationId: conn.organizationId,
    channelConnectionId: conn.id,
    contactId: contact.id,
    externalId: event.from.channelUserId,
  });
  const message = await insertMessage(executor, {
    organizationId: conn.organizationId,
    conversationId: conversation.id,
    channelConnectionId: conn.id,
    contactId: contact.id,
    direction: "inbound",
    content: event.content,
    externalId: event.externalMessageId,
    status: "received",
    sentAt: event.timestamp,
  });
  await updateConversationLastMessage(executor, conversation.id, event.timestamp);
  // Fan out only for a real insert — webhook replays return no row and must
  // not re-notify nor re-run the status transition. pg_notify fires on
  // commit with the write tx; the job row lands in the same tx.
  if (!message) {
    if (created) {
      // Replayed webhook on a resolved chat: the follow-up ticket was
      // created before the deduped insert — drop the empty ticket so a
      // replay can't manufacture a phantom ticket.
      await executor.delete(conversations).where(eq(conversations.id, conversation.id));
    }
    return { eventType: event.type, messageId: null };
  }
  const transitioned = await applyInboundStatusTransition(
    executor,
    conversation.id,
    conversation.status,
  );
  if (created) {
    await emitDomainEvent(executor, {
      type: "conversation.created",
      organizationId: conn.organizationId,
      conversationId: conversation.id,
      contactId: contact.id,
      ticketNumber: conversation.ticketNumber,
      precededById: conversation.precededById,
    });
  }
  await emitDomainEvent(executor, {
    type: "message.received",
    organizationId: conn.organizationId,
    conversationId: conversation.id,
    messageId: message.id,
    contactId: contact.id,
    sentAt: event.timestamp.toISOString(),
  });
  if (transitioned) {
    await emitDomainEvent(executor, {
      type: "conversation.updated",
      organizationId: conn.organizationId,
      conversationId: conversation.id,
      status: transitioned.status,
    });
  }
  await deps?.enqueue?.(executor, {
    organizationId: conn.organizationId,
    channelConnectionId: conn.id,
    eventType: event.type,
    conversationId: conversation.id,
    messageId: message.id,
  });
  return { eventType: event.type, messageId: message.id };
}

/** 'me' = reacted on the phone itself; otherwise the contact's jid. */
async function ingestMessageReaction(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "message.reaction" }>,
): Promise<IngestedEvent> {
  const message = await findMessageByExternalIds(executor, conn.id, [event.messageExternalId]);
  if (!message) return { eventType: event.type, messageId: null };
  const reactorKey = event.fromMe
    ? "me"
    : (event.actorChannelUserId ?? message.contactId ?? "unknown");
  await upsertMessageReaction(executor, {
    organizationId: conn.organizationId,
    messageId: message.id,
    reactorKey,
    emoji: event.emoji,
    actorChannelUserId: event.actorChannelUserId,
    fromMe: event.fromMe,
  });
  await emitDomainEvent(executor, {
    type: "message.updated",
    organizationId: conn.organizationId,
    conversationId: message.conversationId,
    messageId: message.id,
  });
  return { eventType: event.type, messageId: message.id };
}

async function ingestMessageEdited(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "message.edited" }>,
): Promise<IngestedEvent> {
  const message = await findMessageByExternalIds(executor, conn.id, event.messageExternalIds);
  if (!message) return { eventType: event.type, messageId: null };
  // Skip history when the stored text already matches — the echo of our
  // own edit (and webhook replays) dedupe here. Media edits carry the new
  // caption; the shape is preserved (mediaKind/source stay intact).
  const stored = message.content as { type?: string; text?: string; caption?: string };
  const storedText = stored.type === "media" ? stored.caption : stored.text;
  if (storedText === event.newText) {
    return { eventType: event.type, messageId: message.id };
  }
  await applyMessageEdit(executor, {
    organizationId: conn.organizationId,
    messageId: message.id,
    previousContent: message.content,
    newContent:
      stored.type === "media"
        ? { ...(message.content as Record<string, unknown>), caption: event.newText }
        : { type: "text", text: event.newText },
  });
  await emitDomainEvent(executor, {
    type: "message.updated",
    organizationId: conn.organizationId,
    conversationId: message.conversationId,
    messageId: message.id,
  });
  return { eventType: event.type, messageId: message.id };
}

async function ingestMessageRevoked(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "message.revoked" }>,
): Promise<IngestedEvent> {
  const message = await markMessageRevoked(executor, conn.id, event.messageExternalId);
  if (!message) return { eventType: event.type, messageId: null };
  await emitDomainEvent(executor, {
    type: "message.updated",
    organizationId: conn.organizationId,
    conversationId: message.conversationId,
    messageId: message.id,
  });
  return { eventType: event.type, messageId: message.id };
}

/**
 * Transient presence — resolve the active ticket and emit a notify-only
 * event; the client renders a short-lived "digitando…" without a refresh.
 */
async function ingestContactPresence(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "contact.presence" }>,
): Promise<IngestedEvent> {
  const conversation = await findActiveTicket(executor, conn.id, event.chatId);
  if (!conversation) return { eventType: event.type, messageId: null };
  await emitDomainEvent(executor, {
    type: "contact.presence",
    organizationId: conn.organizationId,
    conversationId: conversation.id,
    presence: event.presence,
    participant: event.participant,
  });
  return { eventType: event.type, messageId: null };
}

async function ingestMessageStatus(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "message.status" }>,
  deps?: IngestDeps,
): Promise<IngestedEvent> {
  const message = await updateMessageStatus(
    executor,
    conn.id,
    event.externalMessageId,
    event.status,
  );
  await deps?.enqueue?.(executor, {
    organizationId: conn.organizationId,
    channelConnectionId: conn.id,
    eventType: event.type,
    ...(message ? { messageId: message.id } : {}),
  });
  return { eventType: event.type, messageId: message?.id ?? null };
}

async function ingestConnectionStatus(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: Extract<ChannelEvent, { type: "connection.status" }>,
  deps?: IngestDeps,
): Promise<IngestedEvent> {
  await applyConnectionStatus(executor, conn.id, event.status);
  await deps?.enqueue?.(executor, {
    organizationId: conn.organizationId,
    channelConnectionId: conn.id,
    eventType: event.type,
  });
  return { eventType: event.type, messageId: null };
}

export async function ingestChannelEvent(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: ChannelEvent,
  deps?: IngestDeps,
): Promise<IngestedEvent> {
  switch (event.type) {
    case "message.received":
      return ingestMessageReceived(executor, conn, event, deps);
    case "message.status":
      return ingestMessageStatus(executor, conn, event, deps);
    case "connection.status":
      return ingestConnectionStatus(executor, conn, event, deps);
    // Reactions/edits/revokes update an existing message — never enqueued
    // (they are not inbound messages; nothing to auto-reply to). Presence is
    // transient — notify-only, no enqueue.
    case "message.reaction":
      return ingestMessageReaction(executor, conn, event);
    case "message.edited":
      return ingestMessageEdited(executor, conn, event);
    case "message.revoked":
      return ingestMessageRevoked(executor, conn, event);
    case "contact.presence":
      return ingestContactPresence(executor, conn, event);
  }
}

/**
 * Full webhook pipeline: resolve connection by unguessable token (service
 * scope) → decrypt credentials → verify signature → parse → ingest each
 * event inside its tenant transaction. Throws NotFoundError for unknown
 * tokens and WebhookVerificationError for failed signatures.
 */
export async function ingestChannelWebhook(
  db: Database,
  webhookToken: string,
  request: RawWebhookRequest,
  deps?: IngestDeps,
): Promise<WebhookIngestResult> {
  const resolved = await resolveWebhookConnection(db, webhookToken);
  if (!resolved) throw new NotFoundError("Channel connection");
  const { connection, provider } = resolved;
  if (!provider.verifyWebhook(request)) {
    throw new WebhookVerificationError();
  }
  const processed: IngestedEvent[] = [];
  for (const event of provider.parseWebhook(request)) {
    processed.push(
      await withTenant(db, connection.organizationId, (tx) =>
        ingestChannelEvent(tx, connection, event, deps),
      ),
    );
  }
  return {
    organizationId: connection.organizationId,
    channelConnectionId: connection.id,
    processed,
  };
}

/** Requires messaging:read (every org member). */
export async function listTenantConversations(
  db: Database,
  ctx: TenantContext,
  input?: ListConversationsInput,
): Promise<ConversationListRow[]> {
  assertPermission(ctx, { messaging: ["read"] });
  const parsed = listConversationsInput.parse(input ?? {});
  return listConversations(db, ctx.organizationId, {
    view: parsed.view,
    limit: parsed.limit,
    userId: ctx.userId,
  });
}

/** Roles allowed to inspect revoked originals and edit history. */
export const MESSAGE_INSPECT_ROLES = new Set(["owner", "admin", "manager"]);

export function canInspectMessageHistory(ctx: TenantContext): boolean {
  return ctx.isPlatformAdmin || MESSAGE_INSPECT_ROLES.has(ctx.role);
}

/** Requires messaging:read (every org member). */
export async function listConversationMessages(
  db: Database,
  ctx: TenantContext,
  input: ListMessagesInput,
): Promise<MessageWithAuthorRow[]> {
  assertPermission(ctx, { messaging: ["read"] });
  const parsed = listMessagesInput.parse(input);
  const rows = await listMessages(db, ctx.organizationId, parsed.conversationId, parsed.limit);
  if (canInspectMessageHistory(ctx)) return rows;
  // Revoked content is kept for audit but redacted for non-privileged roles.
  return rows.map((row) => ({
    ...row,
    content: row.revokedAt ? { type: "text" as const, text: "" } : row.content,
    quoted: row.quoted?.revoked ? { ...row.quoted, preview: null } : row.quoted,
  }));
}

/** Requires messaging:read. Throws NotFoundError on unknown/cross-tenant id. */
export async function getConversationDetail(
  db: Database,
  ctx: TenantContext,
  input: ConversationIdInput,
): Promise<ConversationDetailRow> {
  assertPermission(ctx, { messaging: ["read"] });
  const parsed = conversationIdInput.parse(input);
  const row = await withTenant(db, ctx.organizationId, (tx) =>
    repoGetConversationDetail(tx, parsed.conversationId),
  );
  if (!row) throw new NotFoundError("Conversa");
  return row;
}
