import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { ConversationRow, MessageRow } from "./repository";
import type { ConversationView } from "./schemas";

const { contacts, conversations, messageReactions, messages, teams, users } = schema;

/** A conversation row plus the contact identity and a one-line preview. */
export type ConversationListRow = ConversationRow & {
  contactDisplayName: string | null;
  contactChannelUserId: string;
  assigneeName: string | null;
  sectorName: string | null;
  lastMessagePreview: string | null;
  /** Last message inbound — the "needs reply" dot on the row. */
  awaitingReply: boolean;
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

const ACTIVE_STATUSES = sql`${conversations.status} not in ('resolved', 'closed')`;
const TERMINAL_STATUSES = sql`${conversations.status} in ('resolved', 'closed')`;
/** Deferred rows leave the work views until the instant passes — lazy un-snooze. */
const NOT_SNOOZED = sql`(${conversations.snoozedUntil} is null or ${conversations.snoozedUntil} <= now())`;
const SNOOZED = sql`(${conversations.snoozedUntil} > now())`;
/** Correlated scalar — the latest message's direction ('inbound' = awaiting reply). */
const LAST_MSG_DIRECTION_SQL = sql<
  string | null
>`(select m.direction from ${messages} m where m.conversation_id = ${conversations.id} order by m.sent_at desc nulls last, m.created_at desc limit 1)`;

/** Search across contact name, channel user id (phone), external id and ticket #. */
function searchFilter(search: string | undefined) {
  if (!search) return undefined;
  const pattern = `%${search}%`;
  return sql`(${contacts.displayName} ilike ${pattern} or ${contacts.channelUserId} ilike ${pattern} or ${conversations.externalId} ilike ${pattern} or ${conversations.ticketNumber}::text ilike ${pattern})`;
}

/**
 * Inbox views (spec docs/product/inbox.md). Snoozed rows only appear in
 * `snoozed`; ordering surfaces the longest wait where the queue works it.
 */
export async function listConversations(
  db: Database,
  organizationId: string,
  opts: {
    view: ConversationView;
    limit: number;
    userId: string;
    search?: string;
    channelConnectionId?: string;
    sectorId?: string;
    awaitingReply?: boolean;
  },
): Promise<ConversationListRow[]> {
  const viewFilter =
    opts.view === "pending"
      ? eq(conversations.status, "pending")
      : opts.view === "queue"
        ? and(eq(conversations.status, "open"), isNull(conversations.assigneeId), NOT_SNOOZED)
        : opts.view === "mine"
          ? and(eq(conversations.assigneeId, opts.userId), ACTIVE_STATUSES, NOT_SNOOZED)
          : opts.view === "snoozed"
            ? and(ACTIVE_STATUSES, SNOOZED)
            : opts.view === "closed"
              ? TERMINAL_STATUSES
              : and(ACTIVE_STATUSES, NOT_SNOOZED);
  const filters = and(
    viewFilter,
    searchFilter(opts.search),
    opts.channelConnectionId
      ? eq(conversations.channelConnectionId, opts.channelConnectionId)
      : undefined,
    opts.sectorId ? eq(conversations.sectorId, opts.sectorId) : undefined,
    opts.awaitingReply ? sql`${LAST_MSG_DIRECTION_SQL} = 'inbound'` : undefined,
  );
  const order =
    opts.view === "closed"
      ? desc(conversations.resolvedAt)
      : opts.view === "all"
        ? desc(conversations.lastMessageAt)
        : // Work views: longest wait first — fresh tickets (null) sit at the top.
          sql`${conversations.lastMessageAt} asc nulls first`;
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
        awaitingReply: sql<boolean>`${LAST_MSG_DIRECTION_SQL} = 'inbound'`,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contactId))
      .leftJoin(users, eq(users.id, conversations.assigneeId))
      .leftJoin(teams, eq(teams.id, conversations.sectorId))
      .where(filters)
      .orderBy(order)
      .limit(opts.limit),
  );
  return rows.map(({ conversation, ...rest }) => ({ ...conversation, ...rest }));
}

/** Per-tab counters — one grouped scan, no N queries. */
export async function listConversationViewCounts(
  db: Database,
  organizationId: string,
  userId: string,
): Promise<Record<ConversationView, number>> {
  const [row] = await withTenant(db, organizationId, (tx) =>
    tx
      .select({
        pending: sql<number>`(count(*) filter (where ${conversations.status} = 'pending'))::int`,
        queue: sql<number>`(count(*) filter (where ${conversations.status} = 'open' and ${conversations.assigneeId} is null and ${NOT_SNOOZED}))::int`,
        mine: sql<number>`(count(*) filter (where ${conversations.assigneeId} = ${userId} and ${ACTIVE_STATUSES} and ${NOT_SNOOZED}))::int`,
        all: sql<number>`(count(*) filter (where ${ACTIVE_STATUSES} and ${NOT_SNOOZED}))::int`,
        snoozed: sql<number>`(count(*) filter (where ${ACTIVE_STATUSES} and ${SNOOZED}))::int`,
        closed: sql<number>`(count(*) filter (where ${TERMINAL_STATUSES}))::int`,
      })
      .from(conversations),
  );
  return row ?? { pending: 0, queue: 0, mine: 0, all: 0, snoozed: 0, closed: 0 };
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
