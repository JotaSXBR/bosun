// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { TenantContext } from "@crm/core";
import { createLlmCredential } from "@crm/core/ai";
import type { ConnectionRef } from "@crm/core/messaging";
import { ingestChannelEvent, resolveConversation } from "@crm/core/messaging";
import { listAgentSuggestions } from "@crm/core/suggestions";
import type { Database } from "@crm/db";
import { createDb, schema, sql, withTenant } from "@crm/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { observerAnalyzeHandler } from "./observer-analyze";

const { channelConnections, conversations, organizationMembers, organizations, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let userId: string;
let connA: ConnectionRef;
let connB: ConnectionRef;

function ctx(organizationId: string, role: TenantContext["role"]): TenantContext {
  return { organizationId, userId, role, isPlatformAdmin: false };
}

async function resolvedConversation(org: string, conn: ConnectionRef, chatId: string) {
  await withTenant(db, org, (tx) =>
    ingestChannelEvent(tx, conn, {
      type: "message.received",
      externalMessageId: `obs_${chatId}_1`,
      from: { channelUserId: chatId, displayName: "Cliente" },
      content: { type: "text", text: "qual o prazo de entrega?" },
      timestamp: new Date(),
    }),
  );
  const ticket = await withTenant(db, org, async (tx) => {
    const [conv] = await tx
      .select()
      .from(conversations)
      .where(sql`${conversations.externalId} = ${chatId}`)
      .orderBy(sql`${conversations.createdAt} desc`)
      .limit(1);
    return conv!;
  });
  await resolveConversation(db, ctx(org, "admin"), { conversationId: ticket.id });
  return ticket.id;
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
    .values({ name: "IT Observer", email: `it-observer-${suffix}@crm.local` })
    .returning({ id: users.id });
  userId = user!.id;
  for (const [name, slug] of [
    ["Observer IT A", `obs-a-${suffix}`],
    ["Observer IT B", `obs-b-${suffix}`],
  ] as const) {
    const [org] = await db
      .insert(organizations)
      .values({ name, slug })
      .returning({ id: organizations.id });
    if (name.endsWith("A")) orgA = org!.id;
    else orgB = org!.id;
    await db.insert(organizationMembers).values({ organizationId: org!.id, userId, role: "admin" });
  }
  connA = await withTenant(db, orgA, async (tx) => {
    const [row] = await tx
      .insert(channelConnections)
      .values({
        organizationId: orgA,
        kind: "waha",
        name: "IT WAHA A",
        credentialsEncrypted: "not-used",
        webhookToken: `tok-obs-a-${suffix}`,
      })
      .returning();
    return { id: row!.id, organizationId: orgA, kind: row!.kind };
  });
  connB = await withTenant(db, orgB, async (tx) => {
    const [row] = await tx
      .insert(channelConnections)
      .values({
        organizationId: orgB,
        kind: "waha",
        name: "IT WAHA B",
        credentialsEncrypted: "not-used",
        webhookToken: `tok-obs-b-${suffix}`,
      })
      .returning();
    return { id: row!.id, organizationId: orgB, kind: row!.kind };
  });
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} = ${userId}`);
  await db.$client.end();
});

const fakeAnalyze = () =>
  Promise.resolve({
    suggestions: [
      {
        targetType: "knowledge_entry" as const,
        payload: { title: "Prazo", content: "5 dias úteis" },
        rationale: "Cliente perguntou prazo",
      },
    ],
    tokensIn: 42,
    tokensOut: 7,
  });

describe("observerAnalyzeHandler", () => {
  it("skips silently when the org has no LLM credential", async () => {
    const convId = await resolvedConversation(orgA, connA, "nokey@c.us");
    const result = await observerAnalyzeHandler({
      organizationId: orgA,
      conversationId: convId,
    });
    expect(result.skipped).toBe(true);
    expect(result.suggestions).toBe(0);
  });

  it("persists pending suggestions and records usage; re-run dedupes", async () => {
    const convId = await resolvedConversation(orgB, connB, "keyed@c.us");
    await createLlmCredential(db, ctx(orgB, "admin"), {
      provider: "openrouter",
      apiKey: "sk-or-test",
      model: "openai/gpt-5-mini",
      priority: 0,
      label: "test",
      zdr: true,
    });

    const result = await observerAnalyzeHandler(
      { organizationId: orgB, conversationId: convId },
      { analyze: fakeAnalyze },
    );
    expect(result.analyzed).toBe(true);
    expect(result.suggestions).toBe(1);

    const pending = await listAgentSuggestions(db, ctx(orgB, "admin"), { status: "pending" });
    expect(pending).toHaveLength(1);
    expect(pending[0]?.sourceConversationId).toBe(convId);
    expect(pending[0]?.rationale).toContain("prazo");

    // A second run sees the pending suggestion and skips the LLM call.
    const again = await observerAnalyzeHandler(
      { organizationId: orgB, conversationId: convId },
      { analyze: fakeAnalyze },
    );
    expect(again.skipped).toBe(true);
  });
});
