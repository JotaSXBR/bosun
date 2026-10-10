import type { DbExecutor } from "@crm/db";
import { sql } from "@crm/db";
import { createLogger } from "@crm/observability";
import { fromDrizzle } from "pg-boss";

import { getBoss, QUEUES, startJobs } from "./boss";
import type { ChannelReconcilePayload } from "./tasks/channel-messages-reconcile";
import type { GenerateDraftPayload } from "./tasks/generate-draft";
import type { ObserverAnalyzePayload } from "./tasks/observer-analyze";
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
    // Jobs layer not started — kick a lazy start so the process self-heals
    // (covers register() never running or a failed boot attempt; the
    // `starting` singleton in boss.ts dedupes concurrent kicks). This
    // enqueue is still skipped — webhook retries and the reconcile sweep
    // cover the gap. Callers must not fail on a missing queue.
    startJobs().catch(() => {});
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
 * Enqueues a targeted channel reconcile — used right after a connection
 * goes live (post-commit best-effort). The periodic sweep is scheduled in
 * boss.ts and needs no enqueue.
 */
export async function enqueueChannelReconcile(
  payload: ChannelReconcilePayload,
): Promise<{ skipped: boolean }> {
  return send(QUEUES.channelReconcile, payload);
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

/**
 * Enqueues the AI observer after a ticket resolves (pass `tx` so the job row
 * is atomic with the resolve write) or when a user clicks "analyze now"
 * (post-commit best-effort, no tx).
 */
export async function enqueueObserverAnalyze(
  payload: ObserverAnalyzePayload,
  tx?: DbExecutor,
): Promise<{ skipped: boolean }> {
  return send(QUEUES.observerAnalyze, payload, tx);
}

/**
 * Enqueues a draft generation for the composer buttons (post-commit
 * best-effort — a skipped send just means the card never appears; the
 * button stays clickable).
 */
export async function enqueueGenerateDraft(
  payload: GenerateDraftPayload,
  tx?: DbExecutor,
): Promise<{ skipped: boolean }> {
  return send(QUEUES.generateDraft, payload, tx);
}
