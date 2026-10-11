// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TenantContext } from "../../tenant/context";
import { completeStep, getChecklist } from "./service";

const { onboardingChecklist, organizations, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let memberA: string;

function ctx(organizationId: string): TenantContext {
  return { organizationId, userId: memberA, role: "agent", isPlatformAdmin: false };
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
  const [user] = await db
    .insert(users)
    .values({ name: "Member A", email: `it-ob-a-${suffix}@crm.local` })
    .returning({ id: users.id });
  memberA = user!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Onboarding IT A", slug: `onboarding-a-${suffix}` },
      { name: "Onboarding IT B", slug: `onboarding-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(eq(users.id, memberA));
  await db.$client.end();
});

describe("onboarding service", () => {
  it("get-or-creates the checklist row, endowed with org_created", async () => {
    const row = await getChecklist(db, ctx(orgA));
    expect(row.organizationId).toBe(orgA);
    expect(row.steps.org_created).toBeTruthy();

    const again = await getChecklist(db, ctx(orgA));
    expect(again.id).toBe(row.id);
    expect(again.steps.org_created).toBe(row.steps.org_created);
  });

  it("completeStep is idempotent and keeps the first timestamp", async () => {
    const first = await completeStep(db, ctx(orgA), "create_team");
    expect(first.steps.create_team).toBeTruthy();

    await new Promise((r) => setTimeout(r, 20));
    const second = await completeStep(db, ctx(orgA), "create_team");
    expect(second.steps.create_team).toBe(first.steps.create_team);
  });

  it("keeps completed steps when marking others", async () => {
    const row = await completeStep(db, ctx(orgA), "create_funnel");
    expect(Object.keys(row.steps).sort()).toEqual(["create_funnel", "create_team", "org_created"]);
  });

  it("merges concurrent marks of different steps without losing either", async () => {
    // Realistic race: `first_conversation` (ingest tx) vs a user action mark.
    const [a, b] = await Promise.all([
      completeStep(db, ctx(orgB), "connect_channel"),
      completeStep(db, ctx(orgB), "first_conversation"),
    ]);
    expect(a.steps.connect_channel ?? b.steps.connect_channel).toBeTruthy();
    expect(a.steps.first_conversation ?? b.steps.first_conversation).toBeTruthy();

    const final = await getChecklist(db, ctx(orgB));
    expect(final.steps.connect_channel).toBeTruthy();
    expect(final.steps.first_conversation).toBeTruthy();
  });

  it("RLS hides another org's checklist", async () => {
    await completeStep(db, ctx(orgB), "org_created");
    const visible = await withTenant(db, orgA, (tx) =>
      tx
        .select({ id: onboardingChecklist.id })
        .from(onboardingChecklist)
        .where(eq(onboardingChecklist.organizationId, orgB)),
    );
    expect(visible).toEqual([]);
  });
});
