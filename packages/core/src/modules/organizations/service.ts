import type { Database } from "@crm/db";
import type { OrgRole } from "@crm/permissions";
import { isOrgRole } from "@crm/permissions";

import { findMember, listMemberships } from "./repository";

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
