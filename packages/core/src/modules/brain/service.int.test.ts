// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { approveSuggestion, createSystemSuggestion, proposeMemoryEntry } from "../suggestions";
import { findMemoryEntryById, updateMemoryEntry } from "./repository";
import {
  archiveBrainEntry,
  listBrainEntries,
  listCanonForContext,
  listStaleBrainEntries,
  renewBrainEntry,
  sweepStaleBrainEntries,
} from "./service";

const { contacts, organizationMembers, organizations, users } = schema;

let db: Database;
let orgA: string;
let orgB: string;
let memberA: string;
let memberA2: string;
let memberB: string;
let contactA: string;

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
const adminA2 = () => ctx(orgA, memberA2, "admin");
const ownerA = () => ctx(orgA, memberA, "owner");
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
      { name: "Member A", email: `it-brain-a-${suffix}@crm.local` },
      { name: "Member A2", email: `it-brain-a2-${suffix}@crm.local` },
      { name: "Member B", email: `it-brain-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberA2 = members[1]!.id;
  memberB = members[2]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Brain IT A", slug: `brain-a-${suffix}` },
      { name: "Brain IT B", slug: `brain-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: memberA, role: "admin" },
    { organizationId: orgA, userId: memberA2, role: "admin" },
    { organizationId: orgB, userId: memberB, role: "admin" },
  ]);

  const [contact] = await withTenant(db, orgA, (tx) =>
    tx
      .insert(contacts)
      .values({ organizationId: orgA, channelUserId: `wa-${suffix}` })
      .returning({ id: contacts.id }),
  );
  contactA = contact!.id;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} in (${memberA}, ${memberA2}, ${memberB})`);
  await db.$client.end();
});

describe("brain — staging to canon", () => {
  it("human proposal is staged; four-eyes blocks self-approve; peer approves to canon", async () => {
    const suggestion = await proposeMemoryEntry(db, adminA(), {
      type: "pattern",
      content: "Clientes perguntam preço antes de descrever o problema.",
      rationale: "Padrão observado em várias conversas",
    });
    expect(suggestion.targetType).toBe("memory");
    expect(suggestion.proposedBy).toBe(memberA);
    expect(suggestion.status).toBe("pending");

    // Four-eyes: the proposer (non-owner) can't approve their own entry.
    await expect(approveSuggestion(db, adminA(), suggestion.id)).rejects.toMatchObject({
      code: "SUGGESTION_SELF_APPROVE",
    });
    expect((await listBrainEntries(db, adminA())).length).toBe(0);

    const approved = await approveSuggestion(db, adminA2(), suggestion.id);
    expect(approved.status).toBe("approved");

    const canon = await listBrainEntries(db, adminA());
    expect(canon.length).toBe(1);
    expect(canon[0]?.content).toContain("preço");
    expect(canon[0]?.status).toBe("canon");
    expect(canon[0]?.verifiedBy).toBe(memberA2);
    expect(canon[0]?.verifiedAt).toBeTruthy();
    const sources = canon[0]?.sources as { suggestion?: string; proposedBy?: string };
    expect(sources.suggestion).toBe(suggestion.id);
    expect(sources.proposedBy).toBe(memberA);
  });

  it("owner can self-approve (single-person org sovereignty)", async () => {
    const suggestion = await proposeMemoryEntry(db, ownerA(), {
      type: "preference",
      content: "Responder sempre em português brasileiro.",
      rationale: "Política da empresa",
    });
    expect(suggestion.proposedBy).toBe(memberA);
    const approved = await approveSuggestion(db, ownerA(), suggestion.id);
    expect(approved.status).toBe("approved");
  });

  it("observer-originated suggestion (no proposer) promotes to canon", async () => {
    const suggestion = await createSystemSuggestion(db, orgA, {
      targetType: "memory",
      payload: {
        type: "faq_gap",
        content: "Perguntas sobre garantia não têm resposta na base.",
        confidence: "high",
        staleAfterDays: 30,
      },
      rationale: "3 conversas resolvidas sem resposta de knowledge",
    });
    expect(suggestion.proposedBy).toBeNull();

    await approveSuggestion(db, adminA(), suggestion.id);
    const canon = await listBrainEntries(db, adminA(), { type: "faq_gap" });
    expect(canon.length).toBe(1);
    expect(canon[0]?.confidence).toBe("high");
  });

  it("supersedes retires the previous entry in the same approval", async () => {
    const first = await createSystemSuggestion(db, orgA, {
      targetType: "memory",
      payload: { type: "procedure", content: "Prazo de entrega: 5 dias úteis." },
      rationale: "procedimento atual",
    });
    await approveSuggestion(db, adminA(), first.id);
    const [oldEntry] = await listBrainEntries(db, adminA(), { type: "procedure" });

    const second = await createSystemSuggestion(db, orgA, {
      targetType: "memory",
      payload: {
        type: "procedure",
        content: "Prazo de entrega: 3 dias úteis.",
        supersedes: oldEntry!.id,
      },
      rationale: "prazo mudou",
    });
    await approveSuggestion(db, adminA2(), second.id);

    const entries = await listBrainEntries(db, adminA(), { type: "procedure" });
    expect(entries.length).toBe(1);
    expect(entries[0]?.content).toContain("3 dias");

    const old = await withTenant(db, orgA, (tx) => findMemoryEntryById(tx, orgA, oldEntry!.id));
    expect(old?.status).toBe("superseded");
    expect(old?.supersededBy).toBe(entries[0]?.id);
  });

  it("validates scope refs — bad contactId never reaches the inbox", async () => {
    await expect(
      proposeMemoryEntry(db, adminA(), {
        type: "pattern",
        scope: "contact",
        contactId: crypto.randomUUID(),
        content: "x",
        rationale: "r",
      }),
    ).rejects.toMatchObject({ code: "MEMORY_SCOPE_REF_INVALID" });
  });
});

describe("brain — reads and lifecycle", () => {
  it("lists canon by scope/FTS and respects contact scope", async () => {
    const sug = await createSystemSuggestion(db, orgA, {
      targetType: "memory",
      payload: {
        type: "persona",
        scope: "contact",
        contactId: contactA,
        content: "Este contato prefere respostas curtas e diretas.",
      },
      rationale: "histórico do contato",
    });
    await approveSuggestion(db, adminA(), sug.id);

    // FTS (portuguese) finds it; wrong contact doesn't.
    const hit = await listBrainEntries(db, adminA(), { q: "respostas curtas" });
    expect(hit.some((e) => e.scope === "contact")).toBe(true);
    const forContact = await listCanonForContext(db, orgA, { contactId: contactA });
    expect(forContact.some((e) => e.contactId === contactA)).toBe(true);
    const otherContact = await listCanonForContext(db, orgA, {
      contactId: crypto.randomUUID(),
    });
    expect(otherContact.some((e) => e.scope === "contact")).toBe(false);
  });

  it("sweep marks expired canon stale; renew restores; archive removes", async () => {
    const sug = await createSystemSuggestion(db, orgA, {
      targetType: "memory",
      payload: { type: "metric", content: "Ticket médio: R$ 450.", staleAfterDays: 1 },
      rationale: " métrica conhecida",
    });
    await approveSuggestion(db, adminA(), sug.id);
    const [entry] = await listBrainEntries(db, adminA(), { type: "metric" });

    // Backdate expiry then sweep.
    await withTenant(db, orgA, (tx) =>
      updateMemoryEntry(tx, entry!.id, { staleAfter: new Date(Date.now() - 1000) }),
    );
    await sweepStaleBrainEntries(db);

    const stale = await listStaleBrainEntries(db, adminA());
    expect(stale.some((e) => e.id === entry!.id)).toBe(true);
    expect((await listBrainEntries(db, adminA(), { type: "metric" })).length).toBe(0);

    const renewed = await renewBrainEntry(db, adminA(), {
      entryId: entry!.id,
      staleAfterDays: 60,
    });
    expect(renewed.status).toBe("canon");

    const archived = await archiveBrainEntry(db, adminA(), entry!.id);
    expect(archived.status).toBe("archived");
    expect((await listBrainEntries(db, adminA(), { type: "metric" })).length).toBe(0);

    // Archived entries can't be renewed again.
    await expect(
      renewBrainEntry(db, adminA(), { entryId: entry!.id, staleAfterDays: 10 }),
    ).rejects.toMatchObject({ code: "MEMORY_ENTRY_NOT_RENEWABLE" });
  });

  it("enforces permissions and tenant isolation", async () => {
    const canon = await listBrainEntries(db, adminA());
    expect(canon.length).toBeGreaterThan(0);

    // ai:read covers viewers — reads are open to members; mutations need ai:manage.
    expect((await listBrainEntries(db, viewerA())).length).toBeGreaterThan(0);
    await expect(
      proposeMemoryEntry(db, viewerA(), {
        type: "pattern",
        content: "x",
        rationale: "r",
      }),
    ).rejects.toThrowError(AuthorizationError);
    await expect(archiveBrainEntry(db, viewerA(), canon[0]!.id)).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(
      renewBrainEntry(db, viewerA(), { entryId: canon[0]!.id, staleAfterDays: 10 }),
    ).rejects.toThrowError(AuthorizationError);

    // Cross-org: org B sees none of org A's canon; org A ids are not found.
    expect((await listBrainEntries(db, adminB())).length).toBe(0);
    await expect(archiveBrainEntry(db, adminB(), canon[0]!.id)).rejects.toThrowError(NotFoundError);
    await expect(
      renewBrainEntry(db, adminB(), { entryId: canon[0]!.id, staleAfterDays: 10 }),
    ).rejects.toThrowError(NotFoundError);

    // Cross-org propose with org A's contactId must fail scope validation.
    await expect(
      proposeMemoryEntry(db, adminB(), {
        type: "pattern",
        scope: "contact",
        contactId: contactA,
        content: "x",
        rationale: "r",
      }),
    ).rejects.toMatchObject({ code: "MEMORY_SCOPE_REF_INVALID" });
  });
});
