import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";

import { DomainError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { TeamRow, TeamWithMembers } from "./repository";
import {
  deleteTeam,
  deleteTeamMember,
  findTeamById,
  insertTeam,
  insertTeamMember,
  isOrgMember,
  listTeams as repoListTeams,
  updateTeam as repoUpdateTeam,
} from "./repository";
import type { CreateTeamInput, TeamMemberInput, UpdateTeamInput } from "./schemas";
import { createTeamInput, teamMemberInput, updateTeamInput } from "./schemas";

/** Requires teams:read (every org member). */
export async function listTeams(db: Database, ctx: TenantContext): Promise<TeamWithMembers[]> {
  assertPermission(ctx, { teams: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => repoListTeams(tx, ctx.organizationId));
}

/** Requires teams:manage. */
export async function createTeam(
  db: Database,
  ctx: TenantContext,
  input: CreateTeamInput,
): Promise<TeamRow> {
  assertPermission(ctx, { teams: ["manage"] });
  const parsed = createTeamInput.parse(input);
  return withTenant(db, ctx.organizationId, (tx) =>
    insertTeam(tx, {
      organizationId: ctx.organizationId,
      name: parsed.name,
      color: parsed.color,
    }),
  );
}

/** Requires teams:manage. */
export async function updateTeam(
  db: Database,
  ctx: TenantContext,
  input: UpdateTeamInput,
): Promise<TeamRow> {
  assertPermission(ctx, { teams: ["manage"] });
  const parsed = updateTeamInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const team = await findTeamById(tx, ctx.organizationId, parsed.teamId);
    if (!team) throw new NotFoundError("Team", parsed.teamId);
    const updated = await repoUpdateTeam(tx, team.id, {
      name: parsed.name,
      color: parsed.color,
    });
    if (!updated) throw new NotFoundError("Team", parsed.teamId);
    return updated;
  });
}

/** Requires teams:manage. Deletes the team; members cascade. */
export async function removeTeam(db: Database, ctx: TenantContext, teamId: string): Promise<void> {
  assertPermission(ctx, { teams: ["manage"] });
  await withTenant(db, ctx.organizationId, async (tx) => {
    const team = await findTeamById(tx, ctx.organizationId, teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    await deleteTeam(tx, team.id);
  });
}

/** Requires teams:manage. The user must be a member of the organization. */
export async function addTeamMember(
  db: Database,
  ctx: TenantContext,
  input: TeamMemberInput,
): Promise<void> {
  assertPermission(ctx, { teams: ["manage"] });
  const parsed = teamMemberInput.parse(input);
  await withTenant(db, ctx.organizationId, async (tx) => {
    const team = await findTeamById(tx, ctx.organizationId, parsed.teamId);
    if (!team) throw new NotFoundError("Team", parsed.teamId);
    if (!(await isOrgMember(tx, ctx.organizationId, parsed.userId))) {
      throw new DomainError("NOT_ORG_MEMBER", "User is not a member of this organization");
    }
    await insertTeamMember(tx, {
      organizationId: ctx.organizationId,
      teamId: team.id,
      userId: parsed.userId,
    });
  });
}

/** Requires teams:manage. */
export async function removeTeamMember(
  db: Database,
  ctx: TenantContext,
  input: TeamMemberInput,
): Promise<void> {
  assertPermission(ctx, { teams: ["manage"] });
  const parsed = teamMemberInput.parse(input);
  await withTenant(db, ctx.organizationId, async (tx) => {
    const team = await findTeamById(tx, ctx.organizationId, parsed.teamId);
    if (!team) throw new NotFoundError("Team", parsed.teamId);
    await deleteTeamMember(tx, team.id, parsed.userId);
  });
}
