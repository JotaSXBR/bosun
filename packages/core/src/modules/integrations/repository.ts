import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { and, desc, eq } from "drizzle-orm";

const { channelConnections } = schema;

export type ChannelConnectionRow = typeof channelConnections.$inferSelect;

export async function listChannelConnections(
  db: Database,
  organizationId: string,
): Promise<ChannelConnectionRow[]> {
  return withTenant(db, organizationId, async (tx) =>
    tx.select().from(channelConnections).orderBy(desc(channelConnections.createdAt)),
  );
}

export async function insertChannelConnection(
  db: Database,
  organizationId: string,
  values: {
    kind: string;
    name: string;
    credentialsEncrypted: string;
    webhookToken: string;
  },
): Promise<ChannelConnectionRow> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .insert(channelConnections)
      .values({ organizationId, ...values })
      .returning();
    if (!row) throw new Error("channel_connections insert returned no row");
    return row;
  });
}

export async function getChannelConnection(
  db: Database,
  organizationId: string,
  id: string,
): Promise<ChannelConnectionRow | undefined> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .select()
      .from(channelConnections)
      .where(
        and(eq(channelConnections.id, id), eq(channelConnections.organizationId, organizationId)),
      );
    return row;
  });
}

export async function deleteChannelConnection(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  return withTenant(db, organizationId, async (tx) => {
    const rows = await tx
      .delete(channelConnections)
      .where(
        and(eq(channelConnections.id, id), eq(channelConnections.organizationId, organizationId)),
      )
      .returning({ id: channelConnections.id });
    return rows.length > 0;
  });
}

/**
 * Service-scope lookup used by webhook ingestion: the token is the only
 * authentication at this point (provider signature is verified next), so this
 * intentionally bypasses tenant scoping — call it inside withServiceAccess.
 */
export async function findConnectionByWebhookToken(
  executor: DbExecutor,
  webhookToken: string,
): Promise<ChannelConnectionRow | undefined> {
  const [row] = await executor
    .select()
    .from(channelConnections)
    .where(eq(channelConnections.webhookToken, webhookToken));
  return row;
}

/** Service-scope status update driven by provider events/refresh. */
export async function updateConnectionStatus(
  executor: DbExecutor,
  connectionId: string,
  values: {
    status: string;
    connectedAt?: Date | null;
    externalRef?: string;
  },
): Promise<void> {
  await executor
    .update(channelConnections)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(channelConnections.id, connectionId));
}
