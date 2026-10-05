import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, desc, eq, sql } from "drizzle-orm";

const { contacts, conversations, messages } = schema;

export type ContactRow = typeof contacts.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;

/** A conversation row plus the contact identity and a one-line preview. */
export type ConversationListRow = ConversationRow & {
  contactDisplayName: string | null;
  contactChannelUserId: string;
  lastMessagePreview: string | null;
};

/**
 * Finds or creates the contact for (organizationId, channelUserId). When the
 * event carries a displayName it fills/refreshes the stored one; an absent
 * name never overwrites an existing one.
 */
export async function upsertContact(
  executor: DbExecutor,
  organizationId: string,
  values: { channelUserId: string; displayName?: string | undefined },
): Promise<ContactRow> {
  const [row] = await executor
    .insert(contacts)
    .values({
      organizationId,
      channelUserId: values.channelUserId,
      displayName: values.displayName ?? null,
    })
    .onConflictDoUpdate({
      target: [contacts.organizationId, contacts.channelUserId],
      set: {
        displayName: sql`coalesce(excluded.display_name, ${contacts.displayName})`,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("contacts upsert returned no row");
  return row;
}

/** Finds or creates the conversation for (connectionId, externalId). */
export async function upsertConversation(
  executor: DbExecutor,
  values: {
    organizationId: string;
    channelConnectionId: string;
    contactId: string;
    externalId: string;
  },
): Promise<ConversationRow> {
  const [row] = await executor
    .insert(conversations)
    .values({ status: "open", ...values })
    .onConflictDoUpdate({
      target: [conversations.channelConnectionId, conversations.externalId],
      set: { updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("conversations upsert returned no row");
  return row;
}

/**
 * Inserts an inbound message. The partial unique index on
 * (channel_connection_id, external_id) makes webhook replays idempotent —
 * duplicates are silently skipped and return undefined.
 */
export async function insertMessage(
  executor: DbExecutor,
  values: {
    organizationId: string;
    conversationId: string;
    channelConnectionId: string;
    contactId: string | null;
    direction: string;
    content: unknown;
    externalId: string | null;
    status: string;
    sentAt: Date | null;
    private?: boolean;
  },
): Promise<MessageRow | undefined> {
  const [row] = await executor
    .insert(messages)
    .values(values)
    .onConflictDoNothing({
      target: [messages.channelConnectionId, messages.externalId],
      where: sql`${messages.externalId} is not null`,
    })
    .returning();
  return row;
}

/**
 * Inbound message landed on a conversation: `resolved` reopens to `open`
 * (keeps sector, drops assignee), `waiting_customer` returns to
 * `in_progress`. No-op for other statuses — returns the updated row when a
 * transition happened, undefined otherwise.
 */
export async function applyInboundStatusTransition(
  executor: DbExecutor,
  conversationId: string,
  currentStatus: string,
): Promise<ConversationRow | undefined> {
  if (currentStatus !== "resolved" && currentStatus !== "waiting_customer") return undefined;
  const set =
    currentStatus === "resolved"
      ? { status: "open", assigneeId: null, updatedAt: new Date() }
      : { status: "in_progress", updatedAt: new Date() };
  const [row] = await executor
    .update(conversations)
    .set(set)
    .where(eq(conversations.id, conversationId))
    .returning();
  return row;
}

export async function updateConversationLastMessage(
  executor: DbExecutor,
  conversationId: string,
  lastMessageAt: Date,
): Promise<void> {
  await executor
    .update(conversations)
    .set({ lastMessageAt, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/** Applies a provider status (sent/delivered/read/failed) to a stored message. */
export async function updateMessageStatus(
  executor: DbExecutor,
  channelConnectionId: string,
  externalId: string,
  status: string,
): Promise<MessageRow | undefined> {
  const [row] = await executor
    .update(messages)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(messages.channelConnectionId, channelConnectionId),
        eq(messages.externalId, externalId),
      ),
    )
    .returning();
  return row;
}

export async function listConversations(
  db: Database,
  organizationId: string,
  limit: number,
): Promise<ConversationListRow[]> {
  const rows = await withTenant(db, organizationId, (tx) =>
    tx
      .select({
        conversation: conversations,
        contactDisplayName: contacts.displayName,
        contactChannelUserId: contacts.channelUserId,
        // Correlated scalar subquery — cheap under
        // messages_conversation_sent_idx for inbox-sized pages.
        lastMessagePreview: sql<
          string | null
        >`(select coalesce(m.content ->> 'text', m.content ->> 'caption', '[' || (m.content ->> 'type') || ']') from ${messages} m where m.conversation_id = ${conversations.id} order by m.sent_at desc nulls last, m.created_at desc limit 1)`,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contactId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit),
  );
  return rows.map(({ conversation, ...rest }) => ({ ...conversation, ...rest }));
}

export async function listMessages(
  db: Database,
  organizationId: string,
  conversationId: string,
  limit: number,
): Promise<MessageRow[]> {
  return withTenant(db, organizationId, async (tx) =>
    tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.organizationId, organizationId),
        ),
      )
      .orderBy(messages.sentAt)
      .limit(limit),
  );
}
