import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { ConversationRow, MessageRow } from "./repository";

const { contacts, conversations, messages, teams, users } = schema;

/** A conversation row plus the contact identity and a one-line preview. */
export type ConversationListRow = ConversationRow & {
  contactDisplayName: string | null;
  contactChannelUserId: string;
  assigneeName: string | null;
  sectorName: string | null;
  lastMessagePreview: string | null;
};

/** Message row plus the author's display name (null for inbound/system). */
export type MessageWithAuthorRow = MessageRow & { authorName: string | null };

/** Conversation plus contact identity, names and the preceding ticket's numbers. */
export type ConversationDetailRow = ConversationRow & {
  contactDisplayName: string | null;
  contactChannelUserId: string;
  assigneeName: string | null;
  sectorName: string | null;
  precededTicketNumber: number | null;
  precededTicketSeq: number | null;
};

/**
 * Inbox views. `queue` = open tickets with no assignee, oldest waiting first;
 * `mine` = the agent's active tickets; `resolved` = closed-ticket history.
 */
export async function listConversations(
  db: Database,
  organizationId: string,
  opts: { view: "inbox" | "queue" | "mine" | "resolved"; limit: number; userId: string },
): Promise<ConversationListRow[]> {
  const filter =
    opts.view === "queue"
      ? and(eq(conversations.status, "open"), isNull(conversations.assigneeId))
      : opts.view === "mine"
        ? and(eq(conversations.assigneeId, opts.userId), sql`${conversations.status} != 'resolved'`)
        : opts.view === "resolved"
          ? eq(conversations.status, "resolved")
          : undefined;
  const order =
    opts.view === "queue"
      ? asc(conversations.lastMessageAt)
      : opts.view === "resolved"
        ? desc(conversations.resolvedAt)
        : desc(conversations.lastMessageAt);
  const rows = await withTenant(db, organizationId, (tx) =>
    tx
      .select({
        conversation: conversations,
        contactDisplayName: contacts.displayName,
        contactChannelUserId: contacts.channelUserId,
        assigneeName: users.name,
        sectorName: teams.name,
        // Correlated scalar subquery — cheap under
        // messages_conversation_sent_idx for inbox-sized pages.
        lastMessagePreview: sql<
          string | null
        >`(select coalesce(m.content ->> 'text', m.content ->> 'caption', '[' || (m.content ->> 'type') || ']') from ${messages} m where m.conversation_id = ${conversations.id} order by m.sent_at desc nulls last, m.created_at desc limit 1)`,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contactId))
      .leftJoin(users, eq(users.id, conversations.assigneeId))
      .leftJoin(teams, eq(teams.id, conversations.sectorId))
      .where(filter)
      .orderBy(order)
      .limit(opts.limit),
  );
  return rows.map(({ conversation, ...rest }) => ({ ...conversation, ...rest }));
}

export async function listMessages(
  db: Database,
  organizationId: string,
  conversationId: string,
  limit: number,
): Promise<MessageWithAuthorRow[]> {
  return withTenant(db, organizationId, async (tx) => {
    const rows = await tx
      .select({ message: messages, authorName: users.name })
      .from(messages)
      .leftJoin(users, eq(users.id, messages.authorId))
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.organizationId, organizationId),
        ),
      )
      .orderBy(messages.sentAt)
      .limit(limit);
    return rows.map(({ message, ...rest }) => ({ ...message, ...rest }));
  });
}

/** Detail fetch for the conversation page: contact + preceding ticket numbers. */
export async function getConversationDetail(
  executor: DbExecutor,
  conversationId: string,
): Promise<ConversationDetailRow | undefined> {
  const preceded = alias(conversations, "preceded");
  const [row] = await executor
    .select({
      conversation: conversations,
      contactDisplayName: contacts.displayName,
      contactChannelUserId: contacts.channelUserId,
      assigneeName: users.name,
      sectorName: teams.name,
      precededTicketNumber: preceded.ticketNumber,
      precededTicketSeq: preceded.ticketSeq,
    })
    .from(conversations)
    .innerJoin(contacts, eq(contacts.id, conversations.contactId))
    .leftJoin(users, eq(users.id, conversations.assigneeId))
    .leftJoin(teams, eq(teams.id, conversations.sectorId))
    .leftJoin(preceded, eq(preceded.id, conversations.precededById))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!row) return undefined;
  const { conversation, ...rest } = row;
  return { ...conversation, ...rest };
}
