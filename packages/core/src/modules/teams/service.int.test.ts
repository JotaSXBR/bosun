// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, DomainError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import {
  addTeamMember,
  createTeam,
  listTeams,
  removeTeam,
  removeTeamMember,
  updateTeam,
} from "./service";

const { organizationMembers, organizations, teams, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let memberA: string;
let memberB: string;
let outsider: string;

function ctx(organizationId: string, userId: string, role: TenantContext["role"]): TenantContext {
  return { organizationId, userId, role, isPlatformAdmin: false };
}

beforeAll(async () => {
  const env = getServerEnv();
  db = createDb(env.database.url);
  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    throw new Error(
      "Integration tests require a migrated database. Run `pnpm infra:up && pnpm db:migrate` first.",
      { cause: error },
    );
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  const insertedUsers = await db
    .insert(users)
    .values([
      { name: "Member A", email: `it-tm-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-tm-b-${suffix}@crm.local` },
      { name: "Outsider", email: `it-tm-x-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  [memberA, memberB, outsider] = insertedUsers.map((u) => u.id) as [string, string, string];

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Teams IT A", slug: `teams-a-${suffix}` },
      { name: "Teams IT B", slug: `teams-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: memberA, role: "agent" },
    { organizationId: orgB, userId: memberB, role: "agent" },
  ]);
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} in (${memberA}, ${memberB}, ${outsider})`);
  await db.$client.end();
});

describe("teams service", () => {
  it("creates, lists, updates and deletes a team", async () => {
    const created = await createTeam(db, ctx(orgA, memberA, "manager"), {
      name: "Vendas",
      color: "#3366ff",
    });
    expect(created.organizationId).toBe(orgA);

    const listed = await listTeams(db, ctx(orgA, memberA, "agent"));
    expect(listed.map((t) => t.name)).toContain("Vendas");

    const updated = await updateTeam(db, ctx(orgA, memberA, "manager"), {
      teamId: created.id,
      name: "Vendas BR",
    });
    expect(updated.name).toBe("Vendas BR");

    await removeTeam(db, ctx(orgA, memberA, "manager"), created.id);
    const after = await listTeams(db, ctx(orgA, memberA, "agent"));
    expect(after.find((t) => t.id === created.id)).toBeUndefined();
  });

  it("adds and removes members; membership requires org membership", async () => {
    const team = await createTeam(db, ctx(orgA, memberA, "admin"), { name: "Suporte" });

    await addTeamMember(db, ctx(orgA, memberA, "admin"), {
      teamId: team.id,
      userId: memberA,
    });
    // idempotent — adding twice keeps one row
    await addTeamMember(db, ctx(orgA, memberA, "admin"), {
      teamId: team.id,
      userId: memberA,
    });

    const listed = await listTeams(db, ctx(orgA, memberA, "agent"));
    expect(listed.find((t) => t.id === team.id)?.memberUserIds).toEqual([memberA]);

    await expect(
      addTeamMember(db, ctx(orgA, memberA, "admin"), { teamId: team.id, userId: outsider }),
    ).rejects.toThrowError(DomainError);

    await removeTeamMember(db, ctx(orgA, memberA, "admin"), {
      teamId: team.id,
      userId: memberA,
    });
    const after = await listTeams(db, ctx(orgA, memberA, "agent"));
    expect(after.find((t) => t.id === team.id)?.memberUserIds).toHaveLength(0);
  });

  it("rejects duplicate team names with TEAM_NAME_TAKEN", async () => {
    await createTeam(db, ctx(orgA, memberA, "admin"), { name: "Duplicada" });
    const other = await createTeam(db, ctx(orgA, memberA, "admin"), { name: "Outra" });

    await expect(
      createTeam(db, ctx(orgA, memberA, "admin"), { name: "Duplicada" }),
    ).rejects.toMatchObject({ code: "TEAM_NAME_TAKEN" });
    await expect(
      updateTeam(db, ctx(orgA, memberA, "admin"), { teamId: other.id, name: "Duplicada" }),
    ).rejects.toMatchObject({ code: "TEAM_NAME_TAKEN" });
    // the unique index is per-org — the same name in org B is fine
    await expect(
      createTeam(db, ctx(orgB, memberB, "admin"), { name: "Duplicada" }),
    ).resolves.toBeDefined();
  });

  it("denies writes to roles without teams:manage", async () => {
    await expect(
      createTeam(db, ctx(orgA, memberA, "agent"), { name: "Nope" }),
    ).rejects.toThrowError(AuthorizationError);
    await expect(
      createTeam(db, ctx(orgA, memberA, "viewer"), { name: "Nope" }),
    ).rejects.toThrowError(AuthorizationError);
    // reads are fine for every member
    await expect(listTeams(db, ctx(orgA, memberA, "viewer"))).resolves.toBeDefined();
  });

  it("cross-org isolation: org B cannot see or touch org A's teams", async () => {
    const team = await createTeam(db, ctx(orgA, memberA, "admin"), { name: "Só A" });

    const inB = await listTeams(db, ctx(orgB, memberB, "admin"));
    expect(inB.find((t) => t.id === team.id)).toBeUndefined();

    await expect(
      updateTeam(db, ctx(orgB, memberB, "admin"), { teamId: team.id, name: "hack" }),
    ).rejects.toThrowError(NotFoundError);
    await expect(removeTeam(db, ctx(orgB, memberB, "admin"), team.id)).rejects.toThrowError(
      NotFoundError,
    );
    // org B user is not an org member of A either
    await expect(
      addTeamMember(db, ctx(orgB, memberB, "admin"), {
        teamId: team.id,
        userId: memberB,
      }),
    ).rejects.toThrowError(NotFoundError);
  });

  it("RLS rejects writes for another org even at the row level", async () => {
    const error = await withTenant(db, orgB, (tx) =>
      tx.insert(teams).values({ organizationId: orgA, name: "xss" }),
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).not.toBeNull();
    const cause = (error as { cause?: Error }).cause;
    expect(String(cause?.message ?? (error as Error).message)).toMatch(
      /row-level security|row violates/i,
    );
  });
});
