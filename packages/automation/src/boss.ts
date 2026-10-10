import type { ServerEnv } from "@crm/config";
import { getServerEnv } from "@crm/config";
import { createLogger } from "@crm/observability";
import { PgBoss } from "pg-boss";

import { brainStaleSweepHandler } from "./tasks/brain-stale-sweep";
import { channelReconcileHandler } from "./tasks/channel-messages-reconcile";
import { closeResolvedTicketsHandler } from "./tasks/close-resolved-tickets";
import { generateDraftHandler } from "./tasks/generate-draft";
import { observerAnalyzeHandler } from "./tasks/observer-analyze";
import { organizationOnboardingHandler } from "./tasks/organization-onboarding";
import { processChannelEventHandler } from "./tasks/process-channel-event";

const logger = createLogger({ bindings: { component: "jobs" } });

export const QUEUES = {
  processChannelEvent: "process-channel-event",
  organizationOnboarding: "organization-onboarding",
  closeResolvedTickets: "close-resolved-tickets",
  channelReconcile: "channel-messages-reconcile",
  observerAnalyze: "observer-analyze",
  brainStaleSweep: "brain-stale-sweep",
  generateDraft: "generate-draft",
} as const;

let boss: PgBoss | undefined;
let starting: Promise<PgBoss> | undefined;

/**
 * pg-boss runs in-process in the web server (started by instrumentation
 * `register()` on the nodejs runtime only). Its schema lives in `pgboss`,
 * created by migration 0009 as the owner role — the app connects as
 * `crm_app`, so `migrate`/`createSchema` stay off and `boss.start()` only
 * verifies the schema version.
 */
const START_TIMEOUT_MS = 15_000;

export async function startJobs(env: ServerEnv = getServerEnv()): Promise<PgBoss> {
  if (boss) return boss;
  // A rejected/stalled attempt must not poison every future call — clear
  // `starting` so the next enqueue retries. The timeout covers a hung
  // start() (e.g. advisory-lock wait), which otherwise kills the jobs
  // layer forever with no signal.
  starting ??= Promise.race([
    start(env),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`pg-boss start timed out after ${START_TIMEOUT_MS}ms`)),
        START_TIMEOUT_MS,
      ).unref(),
    ),
  ]).catch((error: unknown) => {
    starting = undefined;
    logger.error("pg-boss start failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });
  return starting;
}

async function start(env: ServerEnv): Promise<PgBoss> {
  logger.info("pg-boss starting");
  const instance = new PgBoss({
    connectionString: env.database.url,
    schema: "pgboss",
    migrate: false,
    createSchema: false,
    application_name: "crm-jobs",
  });
  instance.on("error", (error: Error) => {
    logger.error("pg-boss error", { error: error.message });
  });
  await instance.start();

  for (const name of Object.values(QUEUES)) {
    // partition:false — all queues share the job_common partition, so this
    // only inserts a row in pgboss.queue (crm_app needs no CREATE SCHEMA).
    await instance.createQueue(name);
  }
  await instance.work(QUEUES.processChannelEvent, async (jobs) => {
    for (const job of jobs) await processChannelEventHandler(job.data);
  });
  await instance.work(QUEUES.organizationOnboarding, async (jobs) => {
    for (const job of jobs) await organizationOnboardingHandler(job.data);
  });
  await instance.work(QUEUES.closeResolvedTickets, async (jobs) => {
    for (const job of jobs) await closeResolvedTicketsHandler(job.data);
  });
  // Sweep resolved tickets past the reopen window every 15 minutes.
  await instance.schedule(QUEUES.closeResolvedTickets, "*/15 * * * *");
  await instance.work(QUEUES.channelReconcile, async (jobs) => {
    for (const job of jobs) await channelReconcileHandler(job.data);
  });
  // Backfill messages WAHA received while the stack was down — the webhook
  // retry window only covers short outages.
  await instance.schedule(QUEUES.channelReconcile, "*/30 * * * *");
  await instance.work(QUEUES.observerAnalyze, async (jobs) => {
    for (const job of jobs) await observerAnalyzeHandler(job.data);
  });
  await instance.work(QUEUES.brainStaleSweep, async (jobs) => {
    for (const job of jobs) await brainStaleSweepHandler(job.data);
  });
  await instance.work(QUEUES.generateDraft, async (jobs) => {
    for (const job of jobs) await generateDraftHandler(job.data);
  });
  // Flag expired canon memory entries for human review once a day.
  await instance.schedule(QUEUES.brainStaleSweep, "15 3 * * *");

  logger.info("pg-boss started", { queues: Object.values(QUEUES) });
  return (boss = instance);
}

/** The started singleton — undefined until `startJobs()` resolves (tests, edge). */
export function getBoss(): PgBoss | undefined {
  return boss;
}

export async function stopJobs(): Promise<void> {
  const instance = boss;
  boss = undefined;
  starting = undefined;
  await instance?.stop();
}
