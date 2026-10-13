import type { Database } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, desc, eq, sql } from "drizzle-orm";

import { ACTIVE_STATUSES } from "./reads";

const { conversations, messages, users } = schema;

/** One "ticket landed on me" event — private system note from transferConversation. */
export type TransferToMeRow = {
  conversationId: string;
  ticketNumber: number;
  createdAt: Date;
  authorName: string | null;
};

/**
 * "Atribuição" alerts (nav spec §3 sino) — the private system notes
 * transferConversation writes when a ticket lands on the user. Only
 * still-active tickets alert, so resolved transfers age out on their own.
 */
export async function listTransfersTo(
  db: Database,
  organizationId: string,
  { userId, limit = 5, sinceDays = 14 }: { userId: string; limit?: number; sinceDays?: number },
): Promise<TransferToMeRow[]> {
  return withTenant(db, organizationId, (tx) =>
    tx
      .select({
        conversationId: messages.conversationId,
        ticketNumber: conversations.ticketNumber,
        createdAt: messages.createdAt,
        authorName: users.name,
      })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .leftJoin(users, eq(users.id, messages.authorId))
      .where(
        and(
          eq(messages.organizationId, organizationId),
          eq(messages.private, true),
          sql`${messages.metadata} ->> 'system' = 'transfer'`,
          sql`${messages.metadata} ->> 'toAssigneeId' = ${userId}`,
          ACTIVE_STATUSES,
          sql`${messages.createdAt} >= now() - (${sinceDays} || ' days')::interval`,
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit),
  );
}
