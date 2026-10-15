// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "./client";
import { createDb, schema } from "./client";
import { withTenant } from "./tenant";

const { externalConnections, organizations } = schema;

let db: Database;
let orgA: string;
let orgB: string;

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
  const rows = await db
    .insert(organizations)
    .values([
      { name: "ExtConn A", slug: `ext-conn-a-${suffix}` },
      { name: "ExtConn B", slug: `ext-conn-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = rows[0]!.id;
  orgB = rows[1]!.id;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.$client.end();
});

describe("external_connections RLS", () => {
  it("org B sees zero rows of org A's connection", async () => {
    await withTenant(db, orgA, (tx) =>
      tx.insert(externalConnections).values({
        organizationId: orgA,
        provider: "google",
        bundleEncrypted: "v1.fake",
      }),
    );

    const inB = await withTenant(db, orgB, (tx) => tx.select().from(externalConnections));
    expect(inB).toHaveLength(0);
    const inA = await withTenant(db, orgA, (tx) => tx.select().from(externalConnections));
    expect(inA).toHaveLength(1);
    expect(inA[0]!.status).toBe("pending");
  });

  it("cross-org insert is rejected at the row level", async () => {
    const error = await withTenant(db, orgA, (tx) =>
      tx.insert(externalConnections).values({
        organizationId: orgB,
        provider: "google",
        bundleEncrypted: "v1.fake",
      }),
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

  it("without tenant context the app role sees nothing", async () => {
    const rows = await db.select().from(externalConnections);
    expect(rows).toHaveLength(0);
  });

  it("allows one connection per (org, provider)", async () => {
    const error = await withTenant(db, orgA, (tx) =>
      tx.insert(externalConnections).values({
        organizationId: orgA,
        provider: "google",
        bundleEncrypted: "v1.other",
      }),
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).not.toBeNull();
  });
});
