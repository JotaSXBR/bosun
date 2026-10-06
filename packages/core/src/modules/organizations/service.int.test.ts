// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { getOrganizationSettings, listOrgMembers, updateOrganizationSettings } from "./service";

const { organizationMembers, organizations, organizationSettings, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let userId: string;
let user2Id: string;

function ctx(organizationId: string, role: TenantContext["role"]): TenantContext {
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
  const userRows = await db
    .insert(users)
    .values([
      { name: "IT Settings", email: `it-set-${suffix}@crm.local` },
      { name: "IT OrgB Member", email: `it-set2-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  userId = userRows[0]!.id;
  user2Id = userRows[1]!.id;
  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Settings IT A", slug: `set-a-${suffix}` },
      { name: "Settings IT B", slug: `set-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;
  // userId belongs to org A; user2Id belongs to org B only.
  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId, role: "agent" },
    { organizationId: orgB, userId: user2Id, role: "manager" },
  ]);
}, 60_000);

afterAll(async () => {
  await db
    .delete(organizationMembers)
    .where(sql`${organizationMembers.userId} in (${userId}, ${user2Id})`);
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} in (${userId}, ${user2Id})`);
  await db.$client.end();
});

describe("organization_settings service", () => {
  it("get-or-create returns defaults and is idempotent", async () => {
    const first = await getOrganizationSettings(db, ctx(orgA, "viewer"));
    expect(first.organizationId).toBe(orgA);
    expect(first.businessHours).toEqual({});
    expect(first.timezone).toBe("America/Sao_Paulo");

    const second = await getOrganizationSettings(db, ctx(orgA, "agent"));
    expect(second.id).toBe(first.id);
  });

  it("update persists business_hours and off_hours_message", async () => {
    const updated = await updateOrganizationSettings(db, ctx(orgA, "admin"), {
      businessHours: { windows: { mon: [{ start: "09:00", end: "18:00" }] } },
      offHoursMessage: "Voltamos {proximo_atendimento}.",
      timezone: "America/Sao_Paulo",
    });
    expect(updated.businessHours).toEqual({
      windows: { mon: [{ start: "09:00", end: "18:00" }] },
    });
    expect(updated.offHoursMessage).toBe("Voltamos {proximo_atendimento}.");

    const reread = await getOrganizationSettings(db, ctx(orgA, "viewer"));
    expect(reread.id).toBe(updated.id);
    expect(reread.offHoursMessage).toBe("Voltamos {proximo_atendimento}.");
  });

  it("update persists ticketReopenWindowHours and preserves it when omitted", async () => {
    const updated = await updateOrganizationSettings(db, ctx(orgA, "admin"), {
      ticketReopenWindowHours: 24,
    });
    expect(updated.ticketReopenWindowHours).toBe(24);

    const untouched = await updateOrganizationSettings(db, ctx(orgA, "admin"), {
      locale: "pt-BR",
    });
    expect(untouched.ticketReopenWindowHours).toBe(24);
  });

  it("rejects invalid business_hours shapes", async () => {
    await expect(
      updateOrganizationSettings(db, ctx(orgA, "admin"), {
        businessHours: { windows: { mon: [{ start: "9am", end: "18:00" }] } },
      }),
    ).rejects.toThrowError();
  });

  it("viewer and agent cannot update settings", async () => {
    await expect(
      updateOrganizationSettings(db, ctx(orgA, "viewer"), { locale: "en-US" }),
    ).rejects.toThrowError(AuthorizationError);
    await expect(
      updateOrganizationSettings(db, ctx(orgA, "agent"), { locale: "en-US" }),
    ).rejects.toThrowError(AuthorizationError);
  });

  it("cross-org isolation: settings rows never leak", async () => {
    const b = await getOrganizationSettings(db, ctx(orgB, "admin"));
    expect(b.organizationId).toBe(orgB);
    expect(b.offHoursMessage).toBeNull();

    await withTenant(db, orgB, async (tx) => {
      const rows = await tx.select().from(organizationSettings);
      expect(rows.every((r) => r.organizationId === orgB)).toBe(true);
    });
  });
});

describe("listOrgMembers", () => {
  it("returns org members with user identity, scoped to the caller's org", async () => {
    const members = await listOrgMembers(db, ctx(orgA, "agent"));
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      userId,
      name: "IT Settings",
      role: "agent",
    });
    expect(members[0]!.email).toContain("it-set-");

    // org B members exist but never appear in org A's list.
    const membersB = await listOrgMembers(db, ctx(orgB, "manager"));
    expect(membersB.map((m) => m.userId)).toEqual([user2Id]);
  });
});
