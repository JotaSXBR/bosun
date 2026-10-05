// Outbound actions — agent replies through the channel provider and private
// internal notes. Ticket guards live in ./actions (module-internal exports).
import type { ChannelProvider } from "@crm/channels";
import { providerForConnection } from "@crm/core/integrations";
import type { Database } from "@crm/db";
import { emitDomainEvent, withTenant } from "@crm/db";

import { DomainError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { assertTicketOwner, loadActiveTicket, patchTicket } from "./actions";
import type { MessageRow } from "./repository";
import { insertMessage, updateConversationLastMessage } from "./repository";
import type { InternalNoteInput, SendOutboundInput } from "./schemas";
import { internalNoteInput, sendOutboundInput } from "./schemas";

/**
 * Requires messaging:write. Sends an agent reply through the channel provider.
 *
 * Ordering is deliberate: the provider call happens OUTSIDE any DB
 * transaction (a slow/failing provider must not hold row locks), then the
 * persisted state is written in a second tx. Known v1 gap: provider-send
 * succeeded + write failed leaves the customer message unrecorded — accepted
 * and documented; webhook status events still reconcile by externalId.
 *
 * Side effects on success: reply is persisted (authorId = caller), ticket
 * goes to waiting_customer, auto-assigns the caller when unassigned, and
 * first_response_at is stamped once. On provider failure a `failed` message
 * row is kept as an audit trail and SEND_FAILED is thrown.
 */
export async function sendOutboundMessage(
  db: Database,
  ctx: TenantContext,
  input: SendOutboundInput,
  deps?: { provider?: ChannelProvider },
): Promise<MessageRow> {
  assertPermission(ctx, { messaging: ["write"] });
  const parsed = sendOutboundInput.parse(input);
  const conversation = await withTenant(db, ctx.organizationId, (tx) =>
    loadActiveTicket(tx, parsed.conversationId),
  );
  assertTicketOwner(conversation, ctx);
  const provider =
    deps?.provider ??
    (await providerForConnection(db, ctx.organizationId, conversation.channelConnectionId));

  let externalId: string;
  let status: string;
  try {
    const sent = await provider.sendMessage({
      to: conversation.externalId,
      content: { type: "text", text: parsed.text },
    });
    externalId = sent.externalId;
    status = sent.status;
  } catch (cause) {
    await withTenant(db, ctx.organizationId, (tx) =>
      insertMessage(tx, {
        organizationId: ctx.organizationId,
        conversationId: conversation.id,
        channelConnectionId: conversation.channelConnectionId,
        contactId: conversation.contactId,
        direction: "outbound",
        content: { type: "text", text: parsed.text },
        externalId: null,
        status: "failed",
        sentAt: new Date(),
        authorId: ctx.userId,
      }),
    );
    throw new DomainError(
      "SEND_FAILED",
      `Provider failed to send the message: ${(cause as Error).message}`,
    );
  }

  const now = new Date();
  return withTenant(db, ctx.organizationId, async (tx) => {
    // The ticket may have been resolved while the provider call was in
    // flight — re-check inside the write tx before mutating it.
    const current = await loadActiveTicket(tx, conversation.id);
    const message = await insertMessage(tx, {
      organizationId: ctx.organizationId,
      conversationId: conversation.id,
      channelConnectionId: conversation.channelConnectionId,
      contactId: conversation.contactId,
      direction: "outbound",
      content: { type: "text", text: parsed.text },
      externalId,
      status,
      sentAt: now,
      authorId: ctx.userId,
    });
    if (!message) throw new Error("outbound message insert raced");
    await updateConversationLastMessage(tx, conversation.id, now);
    await patchTicket(tx, ctx.organizationId, conversation.id, {
      status: "waiting_customer",
      assigneeId: current.assigneeId ?? ctx.userId,
      firstResponseAt: current.firstResponseAt ?? now,
    });
    await emitDomainEvent(tx, {
      type: "message.sent",
      organizationId: ctx.organizationId,
      conversationId: conversation.id,
      messageId: message.id,
      authorId: ctx.userId,
      sentAt: now.toISOString(),
    });
    return message;
  });
}

/**
 * Requires messaging:write. Internal note — a private outbound-direction
 * message that is never sent to the provider. Resolved tickets reject it.
 */
export async function addInternalNote(
  db: Database,
  ctx: TenantContext,
  input: InternalNoteInput,
): Promise<MessageRow> {
  assertPermission(ctx, { messaging: ["write"] });
  const parsed = internalNoteInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const conversation = await loadActiveTicket(tx, parsed.conversationId);
    assertTicketOwner(conversation, ctx);
    const note = await insertMessage(tx, {
      organizationId: ctx.organizationId,
      conversationId: conversation.id,
      channelConnectionId: conversation.channelConnectionId,
      contactId: null,
      direction: "outbound",
      content: { type: "text", text: parsed.text },
      externalId: null,
      status: "sent",
      sentAt: new Date(),
      private: true,
      authorId: ctx.userId,
    });
    if (!note) throw new Error("internal note insert raced");
    await emitDomainEvent(tx, {
      type: "message.created",
      organizationId: ctx.organizationId,
      conversationId: conversation.id,
      messageId: note.id,
      authorId: ctx.userId,
      private: true,
    });
    return note;
  });
}
