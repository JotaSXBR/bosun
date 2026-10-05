import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";
import type { OrgRole } from "@crm/permissions";
import { isOrgRole } from "@crm/permissions";

import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { OrganizationSettingsRow } from "./repository";
import {
  findMember,
  getOrCreateSettings,
  listMemberships,
  listOrgMembers as repoListOrgMembers,
  upsertSettings,
} from "./repository";
import type { UpdateOrgSettingsInput } from "./schemas";
import { updateOrgSettingsInput } from "./schemas";

export type Membership = { role: OrgRole };

/**
 * Membership lookup used to build the TenantContext. Returns null when the
 * user is not a member of the organization.
 */
export async function getMembership(
  db: Database,
  args: { userId: string; organizationId: string },
): Promise<Membership | null> {
  const member = await findMember(db, args.userId, args.organizationId);
  if (!member || !isOrgRole(member.role)) return null;
  return { role: member.role };
}

export type UserOrganization = {
  organizationId: string;
  name: string;
  role: OrgRole;
};

export type OrgMember = { userId: string; name: string; email: string; role: string };

/** Org members for the transfer/assignee picker — any member may read. */
export async function listOrgMembers(db: Database, ctx: TenantContext): Promise<OrgMember[]> {
  assertPermission(ctx, { messaging: ["read"] });
  return repoListOrgMembers(db, ctx.organizationId);
}

export async function listUserOrganizations(
  db: Database,
  userId: string,
): Promise<UserOrganization[]> {
  const rows = await listMemberships(db, userId);
  return rows
    .filter((row) => isOrgRole(row.role))
    .map((row) => ({
      organizationId: row.organizationId,
      name: row.organizationName,
      role: row.role as OrgRole,
    }));
}

/**
 * Per-org settings, created lazily on first read. Any member may read
 * (messaging:read is the org-wide floor); writes need organization:update.
 */
export async function getOrganizationSettings(
  db: Database,
  ctx: TenantContext,
): Promise<OrganizationSettingsRow> {
  assertPermission(ctx, { messaging: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => getOrCreateSettings(tx, ctx.organizationId));
}

/** Requires organization:update (owner/admin). */
export async function updateOrganizationSettings(
  db: Database,
  ctx: TenantContext,
  input: UpdateOrgSettingsInput,
): Promise<OrganizationSettingsRow> {
  assertPermission(ctx, { organization: ["update"] });
  const parsed = updateOrgSettingsInput.parse(input);
  return withTenant(db, ctx.organizationId, (tx) => upsertSettings(tx, ctx.organizationId, parsed));
}
