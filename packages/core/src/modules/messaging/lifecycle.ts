// Ticket lifecycle sweep — the `close-resolved-tickets` pg-boss job calls
// this on a schedule. Cross-tenant by design: runs under withServiceAccess
// (the scheduler is a trusted system path, same trust level as webhooks) and
// updates resolved tickets whose per-org reopen window has elapsed.
import type { Database } from "@crm/db";
import { emitDomainEvent, schema, sql, withServiceAccess } from "@crm/db";

const { conversations, organizationSettings } = schema;

const DEFAULT_REOPEN_WINDOW_HOURS = 48;

/**
 * Materializes `closed` on resolved tickets past the reopen window
 * (`organization_settings.ticket_reopen_window_hours`, default 48h; orgs
 * without a settings row use the default). Resolved tickets without
 * `resolved_at` (resolved before the column existed) are never expired —
 * without a measurable age the window can't apply. Emits one
 * `conversation.updated` event per closed ticket inside the same tx, so SSE
 * consumers refresh on commit. Returns the closed ticket ids.
 */
export async function closeExpiredResolvedTickets(
  db: Database,
  now: Date = new Date(),
): Promise<string[]> {
  return withServiceAccess(db, async (tx) => {
    const expired = await tx
      .update(conversations)
      .set({ status: "closed", updatedAt: now })
      .where(
        sql`${conversations.status} = 'resolved' and ${conversations.resolvedAt} is not null
            and ${conversations.resolvedAt} < ${now.toISOString()}::timestamptz - make_interval(
              hours => coalesce(
                (select ${organizationSettings.ticketReopenWindowHours}
                 from ${organizationSettings}
                 where ${organizationSettings.organizationId} = ${conversations.organizationId}),
                ${DEFAULT_REOPEN_WINDOW_HOURS}))`,
      )
      .returning({
        id: conversations.id,
        organizationId: conversations.organizationId,
        assigneeId: conversations.assigneeId,
        sectorId: conversations.sectorId,
      });
    for (const row of expired) {
      await emitDomainEvent(tx, {
        type: "conversation.updated",
        organizationId: row.organizationId,
        conversationId: row.id,
        status: "closed",
        assigneeId: row.assigneeId,
        sectorId: row.sectorId,
      });
    }
    return expired.map((row) => row.id);
  });
}
