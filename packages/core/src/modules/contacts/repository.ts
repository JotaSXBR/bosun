import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, asc, eq, sql } from "drizzle-orm";

const { contacts, conversations } = schema;

export type ContactRow = typeof contacts.$inferSelect;

export type ContactListRow = Pick<
  ContactRow,
  "id" | "channelUserId" | "displayName" | "metadata" | "createdAt"
> & { conversationCount: number };

/**
 * Manual contact insert — unlike the ingest-time upsert, a name the agent
 * typed always wins over the stored one. Returns the row (existing or new).
 */
export async function insertOrGetContact(
  executor: DbExecutor,
  organizationId: string,
  values: {
    channelUserId: string;
    displayName: string;
    metadata?: Record<string, unknown> | undefined;
  },
): Promise<ContactRow> {
  const [row] = await executor
    .insert(contacts)
    .values({
      organizationId,
      channelUserId: values.channelUserId,
      displayName: values.displayName,
      metadata: values.metadata ?? {},
    })
    .onConflictDoUpdate({
      target: [contacts.organizationId, contacts.channelUserId],
      set: {
        displayName: values.displayName,
        metadata: sql`${contacts.metadata} || excluded.metadata`,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("contacts insert returned no row");
  return row;
}

/** Tenant-scoped contact lookup (call inside withTenant). */
export async function findContactById(
  executor: DbExecutor,
  contactId: string,
): Promise<ContactRow | undefined> {
  const [row] = await executor.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  return row;
}

/**
 * Contacts page rows — one row per contact with the count of tickets it
 * ever had, name/id search, alphabetical order.
 */
export async function listContacts(
  executor: DbExecutor,
  organizationId: string,
  options: { query?: string | undefined; limit: number; offset: number },
): Promise<ContactListRow[]> {
  const pattern = `%${(options.query ?? "").replace(/[%_\\]/g, "")}%`;
  return executor
    .select({
      id: contacts.id,
      channelUserId: contacts.channelUserId,
      displayName: contacts.displayName,
      metadata: contacts.metadata,
      createdAt: contacts.createdAt,
      conversationCount: sql<number>`(
        select count(*)::int from ${conversations}
        where ${conversations.contactId} = ${contacts.id}
      )`,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.organizationId, organizationId),
        options.query
          ? sql`(${contacts.displayName} ilike ${pattern} or ${contacts.channelUserId} ilike ${pattern})`
          : undefined,
      ),
    )
    .orderBy(asc(contacts.displayName), asc(contacts.channelUserId))
    .limit(options.limit)
    .offset(options.offset);
}
