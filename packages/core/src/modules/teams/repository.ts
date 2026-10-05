import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, eq, inArray } from "drizzle-orm";

const { organizationMembers, teamMembers, teams } = schema;

export type TeamRow = typeof teams.$inferSelect;
export type TeamMemberRow = typeof teamMembers.$inferSelect;
export type TeamWithMembers = TeamRow & { memberUserIds: string[] };

export async function listTeams(
  executor: DbExecutor,
  organizationId: string,
): Promise<TeamWithMembers[]> {
  const teamRows = await executor
    .select()
    .from(teams)
    .where(eq(teams.organizationId, organizationId))
    .orderBy(teams.name);
  if (teamRows.length === 0) return [];

  const memberRows = await executor
    .select({ teamId: teamMembers.teamId, userId: teamMembers.userId })
    .from(teamMembers)
    .where(
      inArray(
        teamMembers.teamId,
        teamRows.map((t) => t.id),
      ),
    );
  const membersByTeam = new Map<string, string[]>();
  for (const m of memberRows) {
    const list = membersByTeam.get(m.teamId) ?? [];
    list.push(m.userId);
    membersByTeam.set(m.teamId, list);
  }
  return teamRows.map((t) => ({ ...t, memberUserIds: membersByTeam.get(t.id) ?? [] }));
}

export async function findTeamById(
  executor: DbExecutor,
  organizationId: string,
  teamId: string,
): Promise<TeamRow | null> {
  const [row] = await executor
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export async function insertTeam(
  executor: DbExecutor,
  values: { organizationId: string; name: string; color?: string | null },
): Promise<TeamRow> {
  const [row] = await executor
    .insert(teams)
    .values({ organizationId: values.organizationId, name: values.name, color: values.color })
    .returning();
  if (!row) throw new Error("teams insert returned no row");
  return row;
}

export async function updateTeam(
  executor: DbExecutor,
  teamId: string,
  values: { name?: string; color?: string | null },
): Promise<TeamRow | undefined> {
  const [row] = await executor
    .update(teams)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(teams.id, teamId))
    .returning();
  return row;
}

export async function deleteTeam(executor: DbExecutor, teamId: string): Promise<boolean> {
  const rows = await executor.delete(teams).where(eq(teams.id, teamId)).returning({ id: teams.id });
  return rows.length > 0;
}

/** organization_members has no RLS — the caller scopes the org id. */
export async function isOrgMember(
  executor: DbExecutor,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);
  return row !== undefined;
}

export async function insertTeamMember(
  executor: DbExecutor,
  values: { organizationId: string; teamId: string; userId: string },
): Promise<TeamMemberRow | undefined> {
  const [row] = await executor
    .insert(teamMembers)
    .values(values)
    .onConflictDoNothing({ target: [teamMembers.teamId, teamMembers.userId] })
    .returning();
  return row;
}

export async function deleteTeamMember(
  executor: DbExecutor,
  teamId: string,
  userId: string,
): Promise<boolean> {
  const rows = await executor
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .returning({ id: teamMembers.id });
  return rows.length > 0;
}
