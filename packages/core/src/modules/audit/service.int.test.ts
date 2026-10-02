// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { listAuditEvents, recordAuditEvent } from "./service";

const { organizations, users } = schema;

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
    .values({ name: "IT User", email: `it-${suffix}@crm.local` })
    .returning({ id: users.id });
  userId = user!.id;
  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Core IT A", slug: `core-a-${suffix}` },
      { name: "Core IT B", slug: `core-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;
});

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} = ${userId}`);
  await db.$client.end();
});

describe("audit service with tenant context", () => {
  it("agent cannot list audit events (AuthorizationError)", async () => {
    await expect(listAuditEvents(db, ctx(orgA, "agent"))).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("admin can record and list audit events", async () => {
    await recordAuditEvent(db, ctx(orgA, "admin"), {
      action: "organization.created",
      targetType: "organization",
      targetId: orgA,
    });
    const events = await listAuditEvents(db, ctx(orgA, "admin"), { limit: 10 });
    expect(events.some((e) => e.action === "organization.created")).toBe(true);
  });

  it("events are isolated between organizations", async () => {
    const eventsB = await listAuditEvents(db, ctx(orgB, "admin"), { limit: 100 });
    expect(eventsB.every((e) => e.organizationId === orgB)).toBe(true);
    expect(eventsB.some((e) => e.action === "organization.created")).toBe(false);
  });
});
