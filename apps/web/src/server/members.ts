import "server-only";

import { getServerEnv } from "@crm/config";
import { AuthorizationError, DomainError, NotFoundError, type TenantContext } from "@crm/core";
import { getInvitationForAccept, listOrgMembers, setInvitationTeam } from "@crm/core/organizations";
import { assignTeamMember, listTeams } from "@crm/core/teams";
import { getDb } from "@crm/db";
import { hasPermission, type OrgRole } from "@crm/permissions";
import { headers } from "next/headers";

import { getAuth } from "./auth";

/**
 * Role-rank helpers shared by the members page and its actions — lives here
 * (not in actions/members.ts) because "use server" files may only export
 * async functions. owner > admin > manager > agent > viewer; an actor never
 * grants a role above their own (nav spec §6). Platform admins act at owner
 * rank.
 */
export const ROLE_RANK: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  agent: 1,
  viewer: 0,
};

export function actorRank(ctx: { role: OrgRole; isPlatformAdmin: boolean }): number {
  return ctx.isPlatformAdmin ? ROLE_RANK.owner : ROLE_RANK[ctx.role];
}

/** Roles the actor may assign — at most their own rank. */
export function assignableRoles(ctx: { role: OrgRole; isPlatformAdmin: boolean }): OrgRole[] {
  const rank = actorRank(ctx);
  return (Object.keys(ROLE_RANK) as OrgRole[]).filter((r) => ROLE_RANK[r] <= rank);
}

export function assertCanGrantRole(
  ctx: { role: OrgRole; isPlatformAdmin: boolean },
  role: OrgRole,
): void {
  if (ROLE_RANK[role] > actorRank(ctx)) throw new AuthorizationError();
}

/**
 * Owner rows are untouchable unless the actor is an owner; nobody manages
 * themselves here (leave org / own account pages cover self).
 */
export function assertCanTargetMember(
  ctx: { role: OrgRole; isPlatformAdmin: boolean; userId: string },
  target: { role: string; userId: string },
): void {
  if (target.userId === ctx.userId) throw new AuthorizationError();
  if (target.role === "owner" && actorRank(ctx) < ROLE_RANK.owner) {
    throw new AuthorizationError();
  }
}

/** Members page gate — member:create OR invitation:create (manager invites). */
export function canSeeMembersPage(ctx: { role: OrgRole; isPlatformAdmin: boolean }): boolean {
  return (
    ctx.isPlatformAdmin ||
    hasPermission(ctx.role, { member: ["create"] }) ||
    hasPermission(ctx.role, { invitation: ["create"] })
  );
}

// --- orchestration (better-auth + core) ---------------------------------------

function requirePermission(ctx: TenantContext, permission: Parameters<typeof hasPermission>[1]) {
  if (!ctx.isPlatformAdmin && !hasPermission(ctx.role, permission)) {
    throw new AuthorizationError();
  }
}

/**
 * Creates the invitation via better-auth (which sends the e-mail best-effort)
 * and attaches the optional team on our team_id column. Returns the public
 * accept link — the members page always shows it since e-mail is optional.
 */
async function assertTeamInOrg(ctx: TenantContext, teamId: string): Promise<void> {
  const teams = await listTeams(getDb(), ctx);
  if (!teams.some((t) => t.id === teamId)) throw new NotFoundError("Team", teamId);
}

export async function inviteMember(
  ctx: TenantContext,
  input: { email: string; role: OrgRole; teamId?: string | null },
): Promise<string> {
  requirePermission(ctx, { invitation: ["create"] });
  assertCanGrantRole(ctx, input.role);
  const db = getDb();
  if (input.teamId) await assertTeamInOrg(ctx, input.teamId);
  const invitation = await getAuth().api.createInvitation({
    headers: await headers(),
    body: { email: input.email, role: input.role },
  });
  if (input.teamId) {
    await setInvitationTeam(db, ctx, { invitationId: invitation.id, teamId: input.teamId });
  }
  return `${getServerEnv().appUrl}/accept-invitation/${invitation.id}`;
}

/** Cancels a pending invitation (invitation:cancel — owner/admin). */
export async function cancelInvitation(ctx: TenantContext, invitationId: string): Promise<void> {
  requirePermission(ctx, { invitation: ["cancel"] });
  await getAuth().api.cancelInvitation({
    headers: await headers(),
    body: { invitationId },
  });
}

async function findMemberOrThrow(ctx: TenantContext, memberId: string) {
  const target = (await listOrgMembers(getDb(), ctx)).find((m) => m.memberId === memberId);
  if (!target) throw new NotFoundError("Member", memberId);
  return target;
}

/** member:update — role capped at actor rank, owner rows need owner rank. */
export async function changeMemberRole(
  ctx: TenantContext,
  input: { memberId: string; role: OrgRole },
): Promise<void> {
  requirePermission(ctx, { member: ["update"] });
  assertCanGrantRole(ctx, input.role);
  assertCanTargetMember(ctx, await findMemberOrThrow(ctx, input.memberId));
  await getAuth().api.updateMemberRole({
    headers: await headers(),
    body: { memberId: input.memberId, role: input.role },
  });
}

/** member:delete — owner rows need owner rank; never self. */
export async function removeMember(ctx: TenantContext, memberId: string): Promise<void> {
  requirePermission(ctx, { member: ["delete"] });
  assertCanTargetMember(ctx, await findMemberOrThrow(ctx, memberId));
  await getAuth().api.removeMember({
    headers: await headers(),
    body: { memberIdOrEmail: memberId },
  });
}

/**
 * Invitation accept — the session user must own the invited email. After
 * better-auth creates the membership we attach the team baked into the
 * invitation and switch the active org so the invitee lands in the tenant.
 */
function assertAcceptable(
  invitation: { status: string; expiresAt: Date | null; email: string },
  email: string,
): void {
  if (invitation.status !== "pending") throw new NotFoundError("Invitation");
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new DomainError("INVITATION_EXPIRED", "Convite expirado.");
  }
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    throw new AuthorizationError();
  }
}

export async function acceptInvitation(
  user: { id: string; email: string },
  invitationId: string,
): Promise<void> {
  const db = getDb();
  const invitation = await getInvitationForAccept(db, invitationId);
  if (!invitation) throw new NotFoundError("Invitation");
  assertAcceptable(invitation, user.email);
  await getAuth().api.acceptInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  if (invitation.teamId) {
    await assignTeamMember(db, {
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      userId: user.id,
    });
  }
  await getAuth().api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId: invitation.organizationId },
  });
}
