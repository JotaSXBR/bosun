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

/**
 * postgres.js raises unique violations with `code`/`constraint_name` —
 * drizzle wraps the driver error on `cause`, so check both levels.
 */
function isTeamNameConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 2 && current; depth += 1) {
    const pgError = current as { code?: string; constraint_name?: string; cause?: unknown };
    if (pgError.code === "23505" && pgError.constraint_name === "teams_org_name_idx") {
      return true;
    }
    current = pgError.cause;
  }
  return false;
}

function teamNameTaken(): never {
  throw new DomainError("TEAM_NAME_TAKEN", "A team with this name already exists");
}

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
  return withTenant(db, ctx.organizationId, async (tx) => {
    try {
      return await insertTeam(tx, {
        organizationId: ctx.organizationId,
        name: parsed.name,
        color: parsed.color,
      });
    } catch (error) {
      if (isTeamNameConflict(error)) teamNameTaken();
      throw error;
    }
  });
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
    let updated: TeamRow | undefined;
    try {
      updated = await repoUpdateTeam(tx, team.id, {
        name: parsed.name,
        color: parsed.color,
      });
    } catch (error) {
      if (isTeamNameConflict(error)) teamNameTaken();
      throw error;
    }
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
