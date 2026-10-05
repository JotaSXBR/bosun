// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { getOrganizationSettings, updateOrganizationSettings } from "./service";

const { organizations, organizationSettings, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let userId: string;

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
      `Integration tests require a migrated database. Run \`pnpm infra:up && pnpm db:migrate\` first.\nCause: ${(error as Error).message}`,
    );
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ name: "IT Settings", email: `it-set-${suffix}@crm.local` })
    .returning({ id: users.id });
  userId = user!.id;
  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Settings IT A", slug: `set-a-${suffix}` },
      { name: "Settings IT B", slug: `set-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} = ${userId}`);
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
