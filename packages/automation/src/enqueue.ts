import type { DbExecutor } from "@crm/db";
import { sql } from "@crm/db";
import { createLogger } from "@crm/observability";
import { fromDrizzle } from "pg-boss";

import { getBoss, QUEUES } from "./boss";
import type { OrganizationOnboardingPayload } from "./tasks/organization-onboarding";
import type { ProcessChannelEventPayload } from "./tasks/process-channel-event";

const logger = createLogger({ bindings: { component: "jobs" } });

/**
 * Enqueues a job inside the caller's transaction when `tx` is passed —
 * the job row commits or rolls back with the domain write, no outbox
 * needed. Without `tx` the send is post-commit best-effort.
 */
async function send(name: string, payload: object, tx?: DbExecutor): Promise<{ skipped: boolean }> {
  const boss = getBoss();
  if (!boss) {
    // Jobs layer not started (unit tests, edge runtime): callers must not
    // fail on a missing queue.
    logger.warn("jobs not started; skipping enqueue", { queue: name });
    return { skipped: true };
  }
  await boss.send(name, payload, tx ? { db: fromDrizzle(tx, sql) } : undefined);
  return { skipped: false };
}

/**
 * Enqueues process-channel-event after a webhook event was persisted. Pass
 * the ingest transaction so the job row is atomic with the message write.
 */
export async function enqueueChannelEventProcessed(
  payload: ProcessChannelEventPayload,
  tx?: DbExecutor,
): Promise<{ skipped: boolean }> {
  return send(QUEUES.processChannelEvent, payload, tx);
}

/**
 * Enqueues the onboarding job after organization creation (Better Auth owns
 * that transaction, so this send is post-commit best-effort by necessity).
 */
export async function enqueueOrganizationOnboarding(
  payload: OrganizationOnboardingPayload,
): Promise<{ skipped: boolean }> {
  return send(QUEUES.organizationOnboarding, payload);
}
