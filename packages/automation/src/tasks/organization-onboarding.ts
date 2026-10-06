import type { TenantContext } from "@crm/core";
import { AuthorizationError } from "@crm/core";
import { recordAuditEvent } from "@crm/core/audit";
import { getMembership } from "@crm/core/organizations";
import { getDb } from "@crm/db";
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
export async function organizationOnboardingHandler(
  payload: unknown,
): Promise<{ organizationId: string }> {
  const parsed = organizationOnboardingPayload.parse(payload);
  const db = getDb();
  const membership = await getMembership(db, {
    userId: parsed.actorUserId,
    organizationId: parsed.organizationId,
  });
  if (!membership) {
    throw new AuthorizationError(
      `organization-onboarding: user ${parsed.actorUserId} is not a member of ${parsed.organizationId}`,
    );
  }
  const ctx: TenantContext = {
    organizationId: parsed.organizationId,
    userId: parsed.actorUserId,
    role: membership.role,
    isPlatformAdmin: false,
  };
  await recordAuditEvent(db, ctx, {
    action: "organization.onboarding_completed",
    targetType: "organization",
    targetId: parsed.organizationId,
  });
  return { organizationId: parsed.organizationId };
}
