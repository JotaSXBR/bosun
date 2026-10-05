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
  findOrCreateTicket,
  insertMessage,
  updateConversationLastMessage,
  updateMessageStatus,
  upsertContact,
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
 * Pure domain ingest — no HTTP. Runs inside the caller's withTenant
 * transaction. `conn` identity always comes from the stored connection row,
 * never from the event payload.
 */
export async function ingestChannelEvent(
  executor: DbExecutor,
  conn: ConnectionRef,
  event: ChannelEvent,
): Promise<IngestedEvent> {
  switch (event.type) {
    case "message.received": {
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
      // Fan out only for a real insert — webhook replays return no row and
      // must not re-notify nor re-run the status transition. pg_notify fires
      // on commit with the write tx.
      if (message) {
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
      } else if (created) {
        // Replayed webhook on a resolved chat: the follow-up ticket was
        // created before the deduped insert — drop the empty ticket so a
        // replay can't manufacture a phantom ticket.
        await executor.delete(conversations).where(eq(conversations.id, conversation.id));
      }
      return { eventType: event.type, messageId: message?.id ?? null };
    }
    case "message.status": {
      const message = await updateMessageStatus(
        executor,
        conn.id,
        event.externalMessageId,
        event.status,
      );
      return { eventType: event.type, messageId: message?.id ?? null };
    }
    case "connection.status": {
      await applyConnectionStatus(executor, conn.id, event.status);
      return { eventType: event.type, messageId: null };
    }
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
        ingestChannelEvent(tx, connection, event),
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

/** Requires messaging:read (every org member). */
export async function listConversationMessages(
  db: Database,
  ctx: TenantContext,
  input: ListMessagesInput,
): Promise<MessageWithAuthorRow[]> {
  assertPermission(ctx, { messaging: ["read"] });
  const parsed = listMessagesInput.parse(input);
  return listMessages(db, ctx.organizationId, parsed.conversationId, parsed.limit);
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
