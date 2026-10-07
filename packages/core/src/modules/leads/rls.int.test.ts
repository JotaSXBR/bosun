// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { createDeal, deleteDeal, moveDeal } from "./deals";
import {
  createLabel,
  deleteLabel,
  listConversationLabels,
  listLabels,
  setConversationLabels,
  setDealLabels,
} from "./labels";
import { createFunnel, createStage, getBoard, listFunnels } from "./service";

const {
  channelConnections,
  contacts,
  conversations,
  dealLabels,
  deals,
  funnelStages,
  funnels,
  labels,
  organizationMembers,
  organizations,
  users,
} = schema;

let db: Database;
let orgA: string;
let orgB: string;
let memberA: string;
let memberB: string;
let contactA: string;
let conversationA: string;

function ctx(organizationId: string, userId: string, role: TenantContext["role"]): TenantContext {
  return { organizationId, userId, role, isPlatformAdmin: false };
}

const adminA = () => ctx(orgA, memberA, "admin");
const agentA = () => ctx(orgA, memberA, "agent");
const managerA = () => ctx(orgA, memberA, "manager");
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
      { name: "Member A", email: `it-rls-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-rls-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberB = members[1]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "RLS IT A", slug: `rls-a-${suffix}` },
      { name: "RLS IT B", slug: `rls-b-${suffix}` },
    ])
    .returning({ id: organizations.id });
  orgA = orgs[0]!.id;
  orgB = orgs[1]!.id;

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: memberA, role: "admin" },
    { organizationId: orgB, userId: memberB, role: "admin" },
  ]);

  const [conn] = await withTenant(db, orgA, (tx) =>
    tx
      .insert(channelConnections)
      .values({
        organizationId: orgA,
        kind: "waha",
        name: "IT WAHA",
        credentialsEncrypted: "not-used-in-these-tests",
        webhookToken: `tok-${suffix}`,
      })
      .returning(),
  );
  const conv = await withTenant(db, orgA, async (tx) => {
    const [contact] = await tx
      .insert(contacts)
      .values({
        organizationId: orgA,
        channelUserId: `5522${suffix}@c.us`,
        displayName: "Contato A",
      })
      .returning();
    const [conversation] = await tx
      .insert(conversations)
      .values({
        organizationId: orgA,
        channelConnectionId: conn!.id,
        contactId: contact!.id,
        externalId: `chat-${suffix}`,
        ticketNumber: 9002,
        ticketSeq: 1,
      })
      .returning();
    return { contactId: contact!.id, conversationId: conversation!.id };
  });
  contactA = conv.contactId;
  conversationA = conv.conversationId;
}, 60_000);

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} in (${orgA}, ${orgB})`);
  await db.delete(users).where(sql`${users.id} in (${memberA}, ${memberB})`);
  await db.$client.end();
});

describe("permissions & isolation", () => {
  it("agent writes deals but cannot manage funnels; viewer is read-only", async () => {
    await expect(createFunnel(db, agentA(), { name: "nope" })).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(createFunnel(db, viewerA(), { name: "nope" })).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(createLabel(db, agentA(), { name: "nope" })).rejects.toThrowError(
      AuthorizationError,
    );
    await expect(listFunnels(db, viewerA())).resolves.toBeDefined();
    await expect(listLabels(db, viewerA())).resolves.toBeDefined();
  });

  it("org B cannot read or touch org A funnels/deals", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Só A" });
    const stage = await createStage(db, adminA(), { funnelId: funnel.id, name: "S" });
    const deal = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: stage.id,
      contactId: contactA,
      title: "secreto",
    });

    expect((await listFunnels(db, adminB())).find((f) => f.id === funnel.id)).toBeUndefined();
    await expect(getBoard(db, adminB(), funnel.id)).rejects.toThrowError(NotFoundError);
    await expect(
      moveDeal(db, adminB(), { dealId: deal.id, stageId: stage.id, position: 0 }),
    ).rejects.toThrowError(NotFoundError);
    await expect(deleteDeal(db, adminB(), deal.id)).rejects.toThrowError(NotFoundError);
  });

  it("RLS rejects an insert for another org at the row level", async () => {
    const error = await withTenant(db, orgB, (tx) =>
      tx.insert(funnels).values({ organizationId: orgA, name: "xss" }),
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

  it("org B sees zero rows in every leads table", async () => {
    await createFunnel(db, adminA(), { name: "RLS check", templateRef: "clinica" });
    for (const table of [
      funnels,
      funnelStages,
      deals,
      labels,
      dealLabels,
      schema.conversationLabels,
    ] as const) {
      const inB = await withTenant(db, orgB, (tx) => tx.select().from(table));
      expect(inB.every((r) => r.organizationId === orgB)).toBe(true);
    }
  });
});

describe("labels", () => {
  it("creates, lists, dedupes and deletes labels", async () => {
    const label = await createLabel(db, managerA(), { name: "Urgente", color: "red" });
    expect((await listLabels(db, viewerA())).map((l) => l.name)).toContain("Urgente");

    await expect(createLabel(db, managerA(), { name: "Urgente" })).rejects.toMatchObject({
      code: "LABEL_NAME_TAKEN",
    });

    await deleteLabel(db, managerA(), label.id);
    expect((await listLabels(db, adminA())).find((l) => l.id === label.id)).toBeUndefined();
  });

  it("applies labels to deals and conversations (replace semantics)", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Labels" });
    const stage = await createStage(db, adminA(), { funnelId: funnel.id, name: "S" });
    const deal = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: stage.id,
      contactId: contactA,
      title: "deal",
    });
    const l1 = await createLabel(db, adminA(), { name: "L1" });
    const l2 = await createLabel(db, adminA(), { name: "L2" });

    await setDealLabels(db, agentA(), { dealId: deal.id, labelIds: [l1.id, l2.id] });
    let board = await getBoard(db, adminA(), funnel.id);
    expect(board.stages[0]!.deals[0]!.labels.map((l) => l.name)).toEqual(["L1", "L2"]);

    await setDealLabels(db, agentA(), { dealId: deal.id, labelIds: [l2.id] });
    board = await getBoard(db, adminA(), funnel.id);
    expect(board.stages[0]!.deals[0]!.labels.map((l) => l.name)).toEqual(["L2"]);

    await setConversationLabels(db, agentA(), {
      conversationId: conversationA,
      labelIds: [l1.id],
    });
    expect((await listConversationLabels(db, viewerA(), conversationA)).map((l) => l.name)).toEqual(
      ["L1"],
    );

    await setConversationLabels(db, agentA(), { conversationId: conversationA, labelIds: [] });
    expect(await listConversationLabels(db, adminA(), conversationA)).toHaveLength(0);
  });

  it("rejects labels from another org", async () => {
    const foreignLabel = await createLabel(db, adminB(), { name: "B-label" });
    const funnel = await createFunnel(db, adminA(), { name: "X-org" });
    const stage = await createStage(db, adminA(), { funnelId: funnel.id, name: "S" });
    const deal = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: stage.id,
      contactId: contactA,
      title: "deal",
    });
    await expect(
      setDealLabels(db, agentA(), { dealId: deal.id, labelIds: [foreignLabel.id] }),
    ).rejects.toThrowError(NotFoundError);
  });
});
