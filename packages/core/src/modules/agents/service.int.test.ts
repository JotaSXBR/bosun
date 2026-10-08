// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { createAgent, deleteAgentById, listAgents, updateAgent } from "./service";

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
const agentRoleA = () => ctx(orgA, memberA, "agent");
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
      { name: "Member A", email: `it-agents-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-agents-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberB = members[1]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Agents IT A", slug: `agents-a-${suffix}` },
      { name: "Agents IT B", slug: `agents-b-${suffix}` },
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

describe("agents", () => {
  it("creates, lists, updates and deletes an agent", async () => {
    const created = await createAgent(db, adminA(), {
      name: "SDR",
      specialty: "qualificação",
      systemPrompt: "Você qualifica leads.",
      toolsAllowlist: ["create_lead"],
      memoryTokenCap: 4096,
      toolExecutionLimit: 5,
    });
    expect(created.status).toBe("draft");

    expect((await listAgents(db, viewerA())).map((a) => a.name)).toContain("SDR");

    const updated = await updateAgent(db, adminA(), {
      agentId: created.id,
      status: "active",
      modelRef: { provider: "openrouter", modelId: "openai/gpt-5-mini" },
    });
    expect(updated.status).toBe("active");
    expect(updated.modelRef).toMatchObject({ provider: "openrouter" });

    await deleteAgentById(db, adminA(), created.id);
    expect(await listAgents(db, adminA())).toHaveLength(0);
  });

  it("rejects duplicate names and enforces permissions", async () => {
    await createAgent(db, adminA(), { name: "Único" });
    await expect(createAgent(db, adminA(), { name: "Único" })).rejects.toMatchObject({
      code: "AGENT_NAME_TAKEN",
    });

    await expect(createAgent(db, agentRoleA(), { name: "nope" })).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(listAgents(db, agentRoleA())).rejects.toThrowError(AuthorizationError);
    await expect(listAgents(db, viewerA())).resolves.toBeDefined();
  });

  it("org B cannot see or touch org A agents", async () => {
    const agent = await createAgent(db, adminA(), { name: "Secreto" });
    expect((await listAgents(db, adminB())).find((a) => a.id === agent.id)).toBeUndefined();
    await expect(
      updateAgent(db, adminB(), { agentId: agent.id, name: "hack" }),
    ).rejects.toThrowError(NotFoundError);
    await expect(deleteAgentById(db, adminB(), agent.id)).rejects.toThrowError(NotFoundError);
  });
});
