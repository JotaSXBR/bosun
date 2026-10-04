import { getServerEnv } from "@crm/config";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { z } from "zod";

import type { DbExecutor } from "./client";

/** Postgres channel that carries every domain event. */
export const DOMAIN_EVENTS_CHANNEL = "crm_domain_events";

/**
 * Compact event envelope pushed through pg_notify. `type` + `organizationId`
 * are the only guaranteed fields; producers add domain-specific ids. Keep the
 * serialized payload under Postgres' 8 KB notify limit — ids, not row data.
 */
export const domainEventSchema = z.looseObject({
  type: z.string().min(1),
  organizationId: z.uuid(),
});

export type DomainEvent = z.infer<typeof domainEventSchema>;

/**
 * Emits a domain event on `crm_domain_events`. Must run inside the
 * transaction that persists the change: pg_notify only delivers on commit,
 * so listeners never see events for rolled-back writes.
 */
export async function emitDomainEvent(executor: DbExecutor, event: DomainEvent): Promise<void> {
  const payload = JSON.stringify(domainEventSchema.parse(event));
  await executor.execute(sql`select pg_notify(${DOMAIN_EVENTS_CHANNEL}, ${payload})`);
}

/**
 * Subscribes to the domain events of a single organization. Opens a dedicated
 * postgres.js connection per subscriber — a LISTEN connection is occupied for
 * its whole lifetime, so it must never come from the pooled app client, and
 * one-per-subscriber keeps unsubscribe as simple as `client.end()` (LISTEN
 * connections are cheap at our scale; revisit if fan-out ever needs hundreds
 * of concurrent subscribers per instance).
 *
 * NOTIFY is database-wide, so the organizationId filter here is what enforces
 * tenant isolation on this channel. Returns the unsubscribe function.
 */
export async function subscribeDomainEvents(
  organizationId: string,
  onEvent: (event: DomainEvent) => void,
): Promise<() => Promise<void>> {
  const client = postgres(getServerEnv().database.url, { max: 1 });
  const request = client.listen(DOMAIN_EVENTS_CHANNEL, (payload) => {
    let raw: unknown;
    try {
      raw = JSON.parse(payload);
    } catch {
      return;
    }
    const event = domainEventSchema.safeParse(raw);
    if (!event.success || event.data.organizationId !== organizationId) return;
    onEvent(event.data);
  });
  try {
    await request;
  } catch (error) {
    await client.end();
    throw error;
  }

  // Idempotent: abort + stream-cancel can both trigger cleanup. Closing the
  // connection terminates the LISTEN server-side — a separate UNLISTEN would
  // race with the socket teardown.
  let done = false;
  return async () => {
    if (done) return;
    done = true;
    await client.end();
  };
}
