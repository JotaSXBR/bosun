import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { ConversationRow, MessageRow } from "./repository";

const { contacts, conversations, messageReactions, messages, teams, users } = schema;

/** A conversation row plus the contact identity and a one-line preview. */
export type ConversationListRow = ConversationRow & {
  contactDisplayName: string | null;
  contactChannelUserId: string;
  assigneeName: string | null;
  sectorName: string | null;
  lastMessagePreview: string | null;
};

/** One stored reaction — reactorKey is the channel id or the user uuid. */
export type MessageReactionView = {
  emoji: string;
  reactorKey: string;
  fromMe: boolean;
  actorUserId: string | null;
};

/** Resolved quote target (content.quotedExternalId → stored message). */
export type QuotedMessageView = {
  preview: string | null;
  direction: string;
  authorName: string | null;
  revoked: boolean;
};

/** Message row plus author name, reactions and the resolved quote target. */
export type MessageWithAuthorRow = MessageRow & {
  authorName: string | null;
  reactions: MessageReactionView[];
  quoted: QuotedMessageView | null;
};

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
        ? and(
            eq(conversations.assigneeId, opts.userId),
            sql`${conversations.status} not in ('resolved', 'closed')`,
          )
        : opts.view === "resolved"
          ? sql`${conversations.status} in ('resolved', 'closed')`
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

const MESSAGE_PREVIEW_SQL = sql<
  string | null
>`coalesce(${messages.content} ->> 'text', ${messages.content} ->> 'caption', '[' || (${messages.content} ->> 'type') || ']')`;

/** externalId this message quotes — set on text and media contents. */
function quotedExternalIdOf(content: unknown): string | null {
  if (typeof content !== "object" || content === null) return null;
  const quoted = (content as Record<string, unknown>).quotedExternalId;
  return typeof quoted === "string" && quoted.length > 0 ? quoted : null;
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
    const list = rows.map(({ message, ...rest }) => ({ ...message, ...rest }));
    const ids = list.map((m) => m.id);
    const quotedIds = [
      ...new Set(list.map((m) => quotedExternalIdOf(m.content)).filter((v) => v !== null)),
    ];

    const [reactionRows, quotedRows] = await Promise.all([
      ids.length === 0
        ? Promise.resolve([])
        : tx
            .select()
            .from(messageReactions)
            .where(inArray(messageReactions.messageId, ids))
            .orderBy(asc(messageReactions.createdAt)),
      quotedIds.length === 0
        ? Promise.resolve([])
        : tx
            .select({
              externalId: messages.externalId,
              preview: MESSAGE_PREVIEW_SQL,
              direction: messages.direction,
              authorName: users.name,
              revokedAt: messages.revokedAt,
            })
            .from(messages)
            .leftJoin(users, eq(users.id, messages.authorId))
            .where(
              and(
                eq(messages.conversationId, conversationId),
                inArray(messages.externalId, quotedIds),
              ),
            ),
    ]);

    const reactionsByMessage = new Map<string, MessageReactionView[]>();
    for (const r of reactionRows) {
      const bucket = reactionsByMessage.get(r.messageId) ?? [];
      bucket.push({
        emoji: r.emoji,
        reactorKey: r.reactorKey,
        fromMe: r.fromMe,
        actorUserId: r.actorUserId,
      });
      reactionsByMessage.set(r.messageId, bucket);
    }
    const quotedByExternalId = new Map(
      quotedRows
        .filter((r) => r.externalId !== null)
        .map((r) => [
          r.externalId as string,
          {
            preview: r.preview,
            direction: r.direction,
            authorName: r.authorName,
            revoked: r.revokedAt !== null,
          },
        ]),
    );

    return list.map((m) => {
      const quotedId = quotedExternalIdOf(m.content);
      return {
        ...m,
        reactions: reactionsByMessage.get(m.id) ?? [],
        quoted: quotedId ? (quotedByExternalId.get(quotedId) ?? null) : null,
      };
    });
  });
}

/**
 * The `limit` NEWEST messages in chronological order — LLM transcript
 * windows (observer/drafter). `listMessages` pages the thread
 * oldest-first; jobs need the tail, where the customer's last message is.
 */
export async function listRecentMessages(
  db: Database,
  organizationId: string,
  conversationId: string,
  limit: number,
): Promise<MessageRow[]> {
  return withTenant(db, organizationId, async (tx) => {
    const rows = await tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.organizationId, organizationId),
        ),
      )
      .orderBy(sql`${messages.sentAt} desc nulls last`, desc(messages.createdAt))
      .limit(limit);
    return rows.reverse();
  });
}

/** Latest inbound timestamp — draft staleness, independent of any list window. */
export async function getLastInboundAt(
  executor: DbExecutor,
  organizationId: string,
  conversationId: string,
): Promise<Date | null> {
  const [row] = await executor
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.organizationId, organizationId),
        eq(messages.direction, "inbound"),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
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
