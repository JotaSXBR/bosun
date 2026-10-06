import type { ChannelProvider } from "@crm/channels";
import type { ChannelConnectionRow } from "@crm/core/integrations";
import { listConnectionsForReconcile, resolveConnectionProvider } from "@crm/core/integrations";
import type { ConnectionRef } from "@crm/core/messaging";
import { ingestChannelEvent } from "@crm/core/messaging";
import type { Database } from "@crm/db";
import { getDb, withTenant } from "@crm/db";
import { createLogger } from "@crm/observability";
import { z } from "zod";

const logger = createLogger({ bindings: { component: "jobs" } });

/**
 * Targeted run (after connect / manual re-sync) carries the connection
 * identity; the scheduled sweep sends an empty payload and reconciles every
 * live WAHA session.
 */
export const channelReconcilePayload = z.object({
  organizationId: z.uuid().optional(),
  channelConnectionId: z.uuid().optional(),
});

export type ChannelReconcilePayload = z.infer<typeof channelReconcilePayload>;

const CHAT_PAGE = 100;
const MESSAGE_PAGE = 100;
/** Backfill safety bound per chat per run — dedup makes re-runs cheap. */
const MAX_MESSAGES_PER_CHAT = 500;

async function reconcileConnection(
  db: Database,
  connection: ChannelConnectionRow,
): Promise<{ listed: number; ingested: number; skipped?: string }> {
  const provider = (await resolveConnectionProvider(db, connection.organizationId, connection.id))
    ?.provider;
  if (!provider?.listChats || !provider.listMessages) {
    return { listed: 0, ingested: 0, skipped: "provider-unsupported" };
  }
  // Backfilling a dead session would query a stopped WAHA session — skip
  // until it reconnects.
  const session = await provider.getSessionInfo?.().catch(() => undefined);
  if (session && session.status !== "connected") {
    return { listed: 0, ingested: 0, skipped: `session-${session.status}` };
  }

  const conn: ConnectionRef = {
    id: connection.id,
    organizationId: connection.organizationId,
    kind: connection.kind,
  };
  let listed = 0;
  let ingested = 0;
  for (const chat of await provider.listChats({ limit: CHAT_PAGE })) {
    const result = await backfillChat(db, conn, provider, chat.id);
    listed += result.listed;
    ingested += result.ingested;
  }
  return { listed, ingested };
}

/** Pages one chat's history into the ingest path (deduped, no fan-out). */
async function backfillChat(
  db: Database,
  conn: ConnectionRef,
  provider: ChannelProvider,
  chatId: string,
): Promise<{ listed: number; ingested: number }> {
  let listed = 0;
  let ingested = 0;
  for (let offset = 0; offset < MAX_MESSAGES_PER_CHAT; offset += MESSAGE_PAGE) {
    const messages = await provider.listMessages?.(chatId, {
      limit: MESSAGE_PAGE,
      offset,
    });
    if (!messages?.length) break;
    listed += messages.length;
    for (const message of messages) {
      // No enqueue dep on purpose: deduped ingest only. Enqueueing
      // process-channel-event here would fire off-hours auto-replies for
      // messages received while the stack was down.
      const result = await withTenant(db, conn.organizationId, (tx) =>
        ingestChannelEvent(tx, conn, { type: "message.received", ...message }),
      );
      if (result.messageId) ingested += 1;
    }
    if (messages.length < MESSAGE_PAGE) break;
  }
  return { listed, ingested };
}

/**
 * Recovers messages WAHA received while Bosun (or WAHA itself) was down —
 * history-sync delivery for those is engine-dependent, so this polls
 * `listChats`/`listMessages` and ingests through the same dedup path as the
 * webhook (`channelConnectionId + externalId` unique). Idempotent.
 */
export async function channelReconcileHandler(
  payload: unknown,
): Promise<{ connections: number; listed: number; ingested: number }> {
  const parsed = channelReconcilePayload.parse(payload);
  const db = getDb();
  // Targeted runs resolve the row directly (a stale `status` is fine — the
  // session check inside reconcileConnection skips dead sessions); the
  // sweep only picks connections persisted as connected.
  let connections: ChannelConnectionRow[];
  if (parsed.organizationId && parsed.channelConnectionId) {
    const resolved = await resolveConnectionProvider(
      db,
      parsed.organizationId,
      parsed.channelConnectionId,
    );
    connections = resolved ? [resolved.connection] : [];
  } else {
    connections = await listConnectionsForReconcile(db);
  }

  let listed = 0;
  let ingested = 0;
  for (const connection of connections) {
    const result = await reconcileConnection(db, connection).catch((error: unknown) => {
      logger.error("channel reconcile failed", {
        channelConnectionId: connection.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return { listed: 0, ingested: 0 };
    });
    listed += result.listed;
    ingested += result.ingested;
  }
  return { connections: connections.length, listed, ingested };
}
