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
  createLlmCredential,
  deleteLlmCredential,
  listLlmCredentials,
  recordUsageEvents,
  resolveOrgLlmCredentials,
  updateLlmCredential,
} from "./service";

const { agentSuggestions, agents, organizations } = schema;

const ORIGINAL_KEY = process.env.CHANNEL_CREDENTIALS_KEY;

let db: Database;
let orgA: string;
let orgB: string;

const ctx = (organizationId: string, role: TenantContext["role"]): TenantContext => ({
  organizationId,
  userId: "user-1",
  role,
  isPlatformAdmin: false,
});
const adminA = () => ctx(orgA, "admin");
const agentA = () => ctx(orgA, "agent");
const viewerA = () => ctx(orgA, "viewer");
const adminB = () => ctx(orgB, "admin");

beforeAll(async () => {
  process.env.CHANNEL_CREDENTIALS_KEY = "b".repeat(64);
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
  const orgs = await db
    .insert(organizations)
    .values([
      { name: "AI IT A", slug: `ai-it-a-${suffix}` },
      { name: "AI IT B", slug: `ai-it-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;
}, 60_000);

afterAll(async () => {
  process.env.CHANNEL_CREDENTIALS_KEY = ORIGINAL_KEY;
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.$client.end();
});

describe("llm credentials", () => {
  it("creates, lists without key material, updates and deletes", async () => {
    const cred = await createLlmCredential(db, adminA(), {
      provider: "openrouter",
      apiKey: "sk-or-secret-12345",
      model: "openai/gpt-5-mini",
      priority: 0,
      zdr: true,
    });
    expect(cred.provider).toBe("openrouter");
    expect("apiKeyEncrypted" in cred).toBe(false);
    expect(JSON.stringify(cred)).not.toContain("sk-or-secret");

    const listed = await listLlmCredentials(db, viewerA());
    expect(listed).toHaveLength(1);
    expect(JSON.stringify(listed)).not.toContain("sk-or-secret");

    const updated = await updateLlmCredential(db, adminA(), {
      credentialId: cred.id,
      label: "principal",
      zdr: false,
    });
    expect(updated.label).toBe("principal");
    expect(updated.zdr).toBe(false);

    await deleteLlmCredential(db, adminA(), cred.id);
    expect(await listLlmCredentials(db, adminA())).toHaveLength(0);
  });

  it("enforces ai:manage on writes and ai:read on reads", async () => {
    await expect(
      createLlmCredential(db, agentA(), {
        provider: "openai",
        apiKey: "sk-test-12345",
        model: "gpt-5",
        priority: 0,
      }),
    ).rejects.toThrowError(AuthorizationError);
    await expect(
      createLlmCredential(db, viewerA(), {
        provider: "openai",
        apiKey: "sk-test-12345",
        model: "gpt-5",
        priority: 0,
      }),
    ).rejects.toThrowError(AuthorizationError);
    await expect(listLlmCredentials(db, agentA())).rejects.toThrowError(AuthorizationError);
  });

  it("resolves the priority chain with decrypted keys; disabled excluded", async () => {
    await createLlmCredential(db, adminA(), {
      provider: "openrouter",
      apiKey: "sk-or-first",
      model: "openai/gpt-5-mini",
      priority: 0,
    });
    await createLlmCredential(db, adminA(), {
      provider: "anthropic",
      apiKey: "sk-ant-second",
      model: "claude-sonnet-4.5",
      priority: 1,
    });
    const third = await createLlmCredential(db, adminA(), {
      provider: "openai",
      apiKey: "sk-oai-third",
      model: "gpt-5",
      priority: 2,
    });
    await updateLlmCredential(db, adminA(), {
      credentialId: third.id,
      status: "disabled",
    });

    const resolved = await withTenant(db, orgA, (tx) => resolveOrgLlmCredentials(tx, orgA));
    expect(resolved.map((c) => c.apiKey)).toEqual(["sk-or-first", "sk-ant-second"]);
    expect(resolved[0]!.zdr).toBe(false);
  });

  it("rejects duplicate provider+priority", async () => {
    await expect(
      createLlmCredential(db, adminA(), {
        provider: "openrouter",
        apiKey: "sk-or-another",
        model: "x",
        priority: 0,
      }),
    ).rejects.toMatchObject({ code: "LLM_PRIORITY_TAKEN" });
  });

  it("org B sees none of org A credentials", async () => {
    expect(await listLlmCredentials(db, adminB())).toHaveLength(0);
    const [a] = await listLlmCredentials(db, adminA());
    await expect(
      updateLlmCredential(db, adminB(), { credentialId: a!.id, label: "x" }),
    ).rejects.toThrowError(NotFoundError);
  });

  it("records usage events", async () => {
    const [cred] = await listLlmCredentials(db, adminA());
    const [agent] = await withTenant(db, orgA, (tx) =>
      tx.insert(agents).values({ organizationId: orgA, name: "Obs" }).returning(),
    );
    await withTenant(db, orgA, (tx) =>
      recordUsageEvents(tx, orgA, [
        {
          agentId: agent!.id,
          credentialId: cred!.id,
          callKind: "observer",
          provider: "openrouter",
          model: "openai/gpt-5-mini",
          tokensIn: 100,
          tokensOut: 40,
          latencyMs: 800,
          status: "ok",
        },
      ]),
    );
    const rows = await withTenant(db, orgA, (tx) => tx.select().from(schema.aiUsageEvents));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokensIn).toBe(100);
  });
});

describe("suggestions FK sanity", () => {
  it("agent suggestion row links to an agent and a source conversation", async () => {
    const [agent] = await withTenant(db, orgA, (tx) =>
      tx.insert(agents).values({ organizationId: orgA, name: "Target" }).returning(),
    );
    const [suggestion] = await withTenant(db, orgA, (tx) =>
      tx
        .insert(agentSuggestions)
        .values({
          organizationId: orgA,
          targetType: "agent",
          targetId: agent!.id,
          payload: { systemPrompt: "Seja mais direto" },
          rationale: "Agente respondeu com rodeios em 3 resoluções",
        })
        .returning(),
    );
    expect(suggestion!.status).toBe("pending");
  });
});
