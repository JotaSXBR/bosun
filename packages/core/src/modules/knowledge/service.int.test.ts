// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  listKnowledgeEntries,
  updateKnowledgeEntry,
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
const agentRoleA = () => ctx(orgA, memberA, "agent");
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
      { name: "Member A", email: `it-kb-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-kb-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberB = members[1]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "KB IT A", slug: `kb-a-${suffix}` },
      { name: "KB IT B", slug: `kb-b-${suffix}` },
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

describe("knowledge entries", () => {
  it("creates, lists, updates and deletes an entry", async () => {
    const entry = await createKnowledgeEntry(db, adminA(), {
      title: "Horário de atendimento",
      content: "Segunda a sexta, 9h às 18h.",
    });
    expect(entry.status).toBe("active");
    expect(entry.source).toBe("manual");

    expect((await listKnowledgeEntries(db, adminA())).map((e) => e.title)).toContain(
      "Horário de atendimento",
    );

    const updated = await updateKnowledgeEntry(db, adminA(), {
      entryId: entry.id,
      status: "archived",
    });
    expect(updated.status).toBe("archived");

    await deleteKnowledgeEntry(db, adminA(), entry.id);
    expect(await listKnowledgeEntries(db, adminA())).toHaveLength(0);
  });

  it("enforces ai permissions and org isolation", async () => {
    await expect(
      createKnowledgeEntry(db, agentRoleA(), { title: "x", content: "y" }),
    ).rejects.toThrowError(AuthorizationError);

    const entry = await createKnowledgeEntry(db, adminA(), {
      title: "Privado",
      content: "só org A",
    });
    expect(await listKnowledgeEntries(db, adminB())).toHaveLength(0);
    await expect(deleteKnowledgeEntry(db, adminB(), entry.id)).rejects.toThrowError(NotFoundError);
  });
});
