import type { TenantContext } from "@crm/core";
import { AuthorizationError } from "@crm/core";
import { recordAuditEvent } from "@crm/core/audit";
import { getMembership } from "@crm/core/organizations";
import { getDb } from "@crm/db";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const organizationOnboardingPayload = z.object({
  organizationId: z.uuid(),
  actorUserId: z.uuid(),
});

export type OrganizationOnboardingPayload = z.infer<typeof organizationOnboardingPayload>;

/**
 * Post-creation organization onboarding. The payload only carries identity —
 * the TenantContext is rebuilt from the membership row (Better Auth tables
 * are not tenant-RLS-scoped, so the lookup works on the app role), never
 * trusted from the payload. All tenant writes go through withTenant-backed
 * services.
 */
export const organizationOnboardingTask = schemaTask({
  id: "organization-onboarding",
  schema: organizationOnboardingPayload,
  run: async (payload) => {
    const db = getDb();
    const membership = await getMembership(db, {
      userId: payload.actorUserId,
      organizationId: payload.organizationId,
    });
    if (!membership) {
      throw new AuthorizationError(
        `organization-onboarding: user ${payload.actorUserId} is not a member of ${payload.organizationId}`,
      );
    }
    const ctx: TenantContext = {
      organizationId: payload.organizationId,
      userId: payload.actorUserId,
      role: membership.role,
      isPlatformAdmin: false,
    };
    await recordAuditEvent(db, ctx, {
      action: "organization.onboarding_completed",
      targetType: "organization",
      targetId: payload.organizationId,
    });
    return { organizationId: payload.organizationId };
  },
});
