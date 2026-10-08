// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "./client";
import { createDb, schema } from "./client";
import { withTenant } from "./tenant";

const {
  agentSuggestions,
  agents,
  aiUsageEvents,
  knowledgeEntries,
  orgLlmCredentials,
  organizations,
} = schema;

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
      { name: "AI RLS A", slug: `ai-rls-a-${suffix}` },
      { name: "AI RLS B", slug: `ai-rls-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = rows[0]!.id;
  orgB = rows[1]!.id;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.$client.end();
});

describe("ai tables RLS", () => {
  it("org B sees zero rows in every AI table", async () => {
    const [cred] = await withTenant(db, orgA, (tx) =>
      tx
        .insert(orgLlmCredentials)
        .values({
          organizationId: orgA,
          provider: "openrouter",
          apiKeyEncrypted: "v1.fake",
          model: "openai/gpt-5-mini",
          priority: 0,
        })
        .returning(),
    );
    const [agent] = await withTenant(db, orgA, (tx) =>
      tx.insert(agents).values({ organizationId: orgA, name: "SDR", status: "active" }).returning(),
    );
    await withTenant(db, orgA, async (tx) => {
      await tx
        .insert(knowledgeEntries)
        .values({ organizationId: orgA, title: "FAQ", content: "..." });
      await tx.insert(agentSuggestions).values({
        organizationId: orgA,
        targetType: "agent",
        targetId: agent!.id,
        payload: { systemPrompt: "novo" },
        rationale: "porque",
      });
      await tx.insert(aiUsageEvents).values({
        organizationId: orgA,
        credentialId: cred!.id,
        callKind: "observer",
        provider: "openrouter",
        model: "openai/gpt-5-mini",
        tokensIn: 10,
        tokensOut: 5,
      });
    });

    for (const table of [
      orgLlmCredentials,
      agents,
      knowledgeEntries,
      agentSuggestions,
      aiUsageEvents,
    ] as const) {
      const inB = await withTenant(db, orgB, (tx) => tx.select().from(table));
      expect(inB).toHaveLength(0);
      const inA = await withTenant(db, orgA, (tx) => tx.select().from(table));
      expect(inA.every((r) => r.organizationId === orgA)).toBe(true);
    }
  });

  it("cross-org insert is rejected at the row level", async () => {
    const error = await withTenant(db, orgA, (tx) =>
      tx.insert(agents).values({ organizationId: orgB, name: "xss", status: "draft" }),
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
    for (const table of [agents, agentSuggestions] as const) {
      const rows = await db.select().from(table);
      expect(rows).toHaveLength(0);
    }
  });
});
