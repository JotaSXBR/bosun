import type { ServerEnv } from "@crm/config";
import { getServerEnv } from "@crm/config";
import { createLogger } from "@crm/observability";
import { PgBoss } from "pg-boss";

import { channelReconcileHandler } from "./tasks/channel-messages-reconcile";
import { closeResolvedTicketsHandler } from "./tasks/close-resolved-tickets";
import { organizationOnboardingHandler } from "./tasks/organization-onboarding";
import { processChannelEventHandler } from "./tasks/process-channel-event";

const logger = createLogger({ bindings: { component: "jobs" } });

export const QUEUES = {
  processChannelEvent: "process-channel-event",
  organizationOnboarding: "organization-onboarding",
  closeResolvedTickets: "close-resolved-tickets",
  channelReconcile: "channel-messages-reconcile",
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
export async function startJobs(env: ServerEnv = getServerEnv()): Promise<PgBoss> {
  if (boss) return boss;
  starting ??= start(env);
  return starting;
}

async function start(env: ServerEnv): Promise<PgBoss> {
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
