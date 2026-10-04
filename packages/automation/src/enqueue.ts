import type { ServerEnv } from "@crm/config";
import { getServerEnv, isConfigured } from "@crm/config";
import { createLogger } from "@crm/observability";
import { tasks } from "@trigger.dev/sdk";

import type {
  OrganizationOnboardingPayload,
  organizationOnboardingTask,
} from "./tasks/organization-onboarding";
import type {
  ProcessChannelEventPayload,
  processChannelEventTask,
} from "./tasks/process-channel-event";

const logger = createLogger({ bindings: { component: "automation" } });

/**
 * Enqueues the onboarding job when Trigger.dev is configured; otherwise logs
 * and reports `{ skipped: true }` so callers never fail because background
 * jobs aren't wired up (local dev without Trigger).
 */
export async function enqueueOrganizationOnboarding(
  payload: OrganizationOnboardingPayload,
  env: ServerEnv = getServerEnv(),
): Promise<{ skipped: boolean }> {
  if (!isConfigured(env, "trigger")) {
    logger.info("Trigger.dev not configured; skipping organization-onboarding", {
      organizationId: payload.organizationId,
    });
    return { skipped: true };
  }
  await tasks.trigger<typeof organizationOnboardingTask>("organization-onboarding", payload);
  return { skipped: false };
}

/**
 * Enqueues process-channel-event after a webhook event was persisted; no-ops
 * with `{ skipped: true }` when Trigger.dev isn't configured so ingestion
 * never fails because of the background layer.
 */
export async function enqueueChannelEventProcessed(
  payload: ProcessChannelEventPayload,
  env: ServerEnv = getServerEnv(),
): Promise<{ skipped: boolean }> {
  if (!isConfigured(env, "trigger")) {
    logger.info("Trigger.dev not configured; skipping process-channel-event", {
      organizationId: payload.organizationId,
      eventType: payload.eventType,
    });
    return { skipped: true };
  }
  await tasks.trigger<typeof processChannelEventTask>("process-channel-event", payload);
  return { skipped: false };
}
