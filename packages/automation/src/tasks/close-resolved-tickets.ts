import { closeExpiredResolvedTickets } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { z } from "zod";

export const closeResolvedTicketsPayload = z.object({}).loose();

/**
 * Scheduled sweep (every 15 min): materializes `closed` on resolved tickets
 * whose per-org reopen window elapsed. The payload is empty — everything is
 * derived from the database under withServiceAccess.
 */
export async function closeResolvedTicketsHandler(payload: unknown): Promise<{ closed: number }> {
  closeResolvedTicketsPayload.parse(payload);
  const closed = await closeExpiredResolvedTickets(getDb());
  return { closed: closed.length };
}
