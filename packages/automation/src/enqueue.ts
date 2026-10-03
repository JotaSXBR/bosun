import type { ServerEnv } from "@crm/config";
import { getServerEnv, isConfigured } from "@crm/config";
import { createLogger } from "@crm/observability";
import { tasks } from "@trigger.dev/sdk";

import type {
  OrganizationOnboardingPayload,
  organizationOnboardingTask,
} from "./tasks/organization-onboarding";

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
