// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { createAgent, findAgentById } from "../agents";
import { listKnowledgeEntries } from "../knowledge";
import {
  approveSuggestion,
  createSystemSuggestion,
  listAgentSuggestions,
  rejectSuggestion,
} from "./service";

const { organizationMembers, organizations, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let memberA: string;
let memberB: string;

const ctx = (
  organizationId: string,
  userId: string,
  role: TenantContext["role"],
): TenantContext => ({
  organizationId,
  userId,
  role,
  isPlatformAdmin: false,
});
const adminA = () => ctx(orgA, memberA, "admin");
const viewerA = () => ctx(orgA, memberA, "viewer");
const adminB = () => ctx(orgB, memberB, "admin");

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
  const members = await db
    .insert(users)
    .values([
      { name: "Member A", email: `it-sug-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-sug-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberB = members[1]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Suggestions IT A", slug: `sug-a-${suffix}` },
      { name: "Suggestions IT B", slug: `sug-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: memberA, role: "admin" },
    { organizationId: orgB, userId: memberB, role: "admin" },
  ]);
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} in (${memberA}, ${memberB})`);
  await db.$client.end();
});

describe("suggestions", () => {
  it("approves an agent diff and applies it atomically", async () => {
    const agent = await createAgent(db, adminA(), {
      name: "Observado",
      systemPrompt: "prompt antigo",
    });

    const suggestion = await createSystemSuggestion(db, orgA, {
      targetType: "agent",
      targetId: agent.id,
      payload: { systemPrompt: "prompt novo", status: "active" },
      rationale: "Conversas mostram prompt fraco",
    });
    expect(suggestion.status).toBe("pending");
    expect((await listAgentSuggestions(db, adminA(), { status: "pending" }))[0]?.id).toBe(
      suggestion.id,
    );

    const approved = await approveSuggestion(db, adminA(), suggestion.id);
    expect(approved.status).toBe("approved");
    expect(approved.reviewedBy).toBe(memberA);

    const applied = await withTenant(db, orgA, (tx) => findAgentById(tx, orgA, agent.id));
    expect(applied?.systemPrompt).toBe("prompt novo");
    expect(applied?.status).toBe("active");

    // Idempotent re-approve returns the reviewed row.
    const again = await approveSuggestion(db, adminA(), suggestion.id);
    expect(again.status).toBe("approved");
  });

  it("approves a create suggestion into a knowledge entry", async () => {
    const suggestion = await createSystemSuggestion(db, orgA, {
      targetType: "knowledge_entry",
      payload: { title: "FAQ prazo", content: "Entrega em 5 dias úteis." },
      rationale: "Clientes perguntam prazo toda semana",
    });

    const approved = await approveSuggestion(db, adminA(), suggestion.id);
    expect(approved.status).toBe("approved");

    const entries = await listKnowledgeEntries(db, adminA());
    const entry = entries.find((e) => e.title === "FAQ prazo");
    expect(entry?.source).toBe("suggestion");
    expect(entry?.content).toBe("Entrega em 5 dias úteis.");
  });

  it("rejects and refuses a later approve", async () => {
    const suggestion = await createSystemSuggestion(db, orgA, {
      targetType: "agent",
      payload: { name: "Novo agente", systemPrompt: "x" },
      rationale: "criar agente dedicado",
    });

    const rejected = await rejectSuggestion(db, adminA(), suggestion.id);
    expect(rejected.status).toBe("rejected");
    expect(rejected.reviewedBy).toBe(memberA);

    await expect(approveSuggestion(db, adminA(), suggestion.id)).rejects.toMatchObject({
      code: "SUGGESTION_ALREADY_REVIEWED",
    });
    // Idempotent re-reject.
    expect((await rejectSuggestion(db, adminA(), suggestion.id)).status).toBe("rejected");
  });

  it("enforces permissions and tenant isolation", async () => {
    const suggestion = await createSystemSuggestion(db, orgA, {
      targetType: "knowledge_entry",
      payload: { title: "T", content: "C" },
      rationale: "r",
    });

    await expect(approveSuggestion(db, viewerA(), suggestion.id)).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(rejectSuggestion(db, viewerA(), suggestion.id)).rejects.toThrowError(
      AuthorizationError,
    );

    // Cross-org: admin of org B cannot review org A's suggestion.
    await expect(approveSuggestion(db, adminB(), suggestion.id)).rejects.toThrowError(
      NotFoundError,
    );
    expect(
      (await listAgentSuggestions(db, adminB(), {})).find((s) => s.id === suggestion.id),
    ).toBeUndefined();
  });
});
