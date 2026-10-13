import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";
import type { OrgRole } from "@crm/permissions";
import { isOrgRole } from "@crm/permissions";

import { NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type {
  InvitationForAccept,
  OrganizationSettingsRow,
  PendingInvitationRow,
} from "./repository";
import {
  findInvitation,
  findMember,
  getOrCreateSettings,
  listMemberships,
  listOrgMembers as repoListOrgMembers,
  listPendingInvitations,
  updateInvitationTeam,
  upsertSettings,
} from "./repository";
import type { UpdateObserverSettingsInput, UpdateOrgSettingsInput } from "./schemas";
import { updateObserverSettingsInput, updateOrgSettingsInput } from "./schemas";

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

export type OrgMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

/** Org members for the transfer/assignee picker — any member may read. */
export async function listOrgMembers(db: Database, ctx: TenantContext): Promise<OrgMember[]> {
  assertPermission(ctx, { messaging: ["read"] });
  return repoListOrgMembers(db, ctx.organizationId);
}

/**
 * Pending invitations for the members page. Requires invitation:create —
 * owner/admin manage, manager invites (nav spec §4/§6).
 */
export async function listOrgInvitations(
  db: Database,
  ctx: TenantContext,
): Promise<PendingInvitationRow[]> {
  assertPermission(ctx, { invitation: ["create"] });
  return withTenant(db, ctx.organizationId, (tx) => listPendingInvitations(tx, ctx.organizationId));
}

/**
 * Sets the team on a just-created invitation (better-auth writes the row,
 * we attach team_id). Requires invitation:create; org-scoped update.
 */
export async function setInvitationTeam(
  db: Database,
  ctx: TenantContext,
  args: { invitationId: string; teamId: string | null },
): Promise<void> {
  assertPermission(ctx, { invitation: ["create"] });
  const updated = await updateInvitationTeam(
    db,
    ctx.organizationId,
    args.invitationId,
    args.teamId,
  );
  if (!updated) throw new NotFoundError("Invitation", args.invitationId);
}

/**
 * Public accept-page lookup — no TenantContext: the invitation id is the
 * capability token and the invitee has no session/org context yet.
 */
export async function getInvitationForAccept(
  db: Database,
  invitationId: string,
): Promise<InvitationForAccept | null> {
  return findInvitation(db, invitationId);
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

/**
 * Requires ai:manage — observer mode is an AI-surface setting, not a
 * general org setting, so it follows the credentials/agents permission.
 */
export async function updateObserverSettings(
  db: Database,
  ctx: TenantContext,
  input: UpdateObserverSettingsInput,
): Promise<OrganizationSettingsRow> {
  assertPermission(ctx, { ai: ["manage"] });
  const parsed = updateObserverSettingsInput.parse(input);
  return withTenant(db, ctx.organizationId, (tx) => upsertSettings(tx, ctx.organizationId, parsed));
}
