import type { OrgRole, PermissionCheck } from "@crm/permissions";
import { hasPermission } from "@crm/permissions";

import { AuthorizationError } from "../errors";

/**
 * Who is acting, and inside which organization. Built once per request
 * (apps/web/src/server/tenant.ts) and passed to services — services never
 * accept an organizationId except via this context.
 */
export type TenantContext = {
  organizationId: string;
  userId: string;
  role: OrgRole;
  isPlatformAdmin: boolean;
};

export function assertPermission(ctx: TenantContext, permissions: PermissionCheck): void {
  if (ctx.isPlatformAdmin) return;
  if (!hasPermission(ctx.role, permissions)) {
    throw new AuthorizationError();
  }
}
