// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import {
  createDeal,
  createDealFromConversation,
  deleteDeal,
  getDealForConversation,
  moveDeal,
} from "./deals";
import { createFunnel, createStage, deleteStage, getBoard, moveStage } from "./service";

const { channelConnections, contacts, conversations, organizationMembers, organizations, users } =
  schema;

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
      { name: "Member A", email: `it-leads-a-${suffix}@crm.local` },
      { name: "Member B", email: `it-leads-b-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  memberA = members[0]!.id;
  memberB = members[1]!.id;

  const orgs = await db
    .insert(organizations)
    .values([
      { name: "Leads IT A", slug: `leads-a-${suffix}` },
      { name: "Leads IT B", slug: `leads-b-${suffix}` },
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
        channelUserId: `5511${suffix}@c.us`,
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
        ticketNumber: 9001,
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

describe("funnels & stages", () => {
  it("creates a funnel from a niche template — stages seeded in order", async () => {
    const funnel = await createFunnel(db, adminA(), {
      name: "Imobiliária",
      templateRef: "imobiliaria",
    });
    expect(funnel.templateRef).toBe("imobiliaria");

    const board = await getBoard(db, viewerA(), funnel.id);
    expect(board.stages.map((s) => s.name)).toEqual([
      "Novo lead",
      "Qualificação",
      "Visita agendada",
      "Proposta",
      "Negociação",
      "Fechado",
    ]);
  });

  it("rejects an unknown template ref", async () => {
    await expect(
      createFunnel(db, adminA(), { name: "X", templateRef: "nope" }),
    ).rejects.toMatchObject({ code: "TEMPLATE_UNKNOWN" });
  });

  it("appends, renames, reorders and deletes stages", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Funil manual" });
    const s1 = await createStage(db, managerA(), { funnelId: funnel.id, name: "Entrada" });
    const s2 = await createStage(db, managerA(), { funnelId: funnel.id, name: "Saída" });

    let stages = (await getBoard(db, adminA(), funnel.id)).stages;
    expect(stages.map((s) => s.name)).toEqual(["Entrada", "Saída"]);

    await moveStage(db, managerA(), { stageId: s2.id, position: 0 });
    stages = (await getBoard(db, adminA(), funnel.id)).stages;
    expect(stages.map((s) => s.name)).toEqual(["Saída", "Entrada"]);
    expect(stages.map((s) => s.position)).toEqual([0, 1]);

    await deleteStage(db, managerA(), s1.id);
    expect((await getBoard(db, adminA(), funnel.id)).stages).toHaveLength(1);
    await deleteStage(db, managerA(), s2.id);
  });

  it("refuses to delete a stage that still holds deals", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Com deal" });
    const stage = await createStage(db, adminA(), { funnelId: funnel.id, name: "S1" });
    await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: stage.id,
      contactId: contactA,
      title: "Deal no stage",
    });
    await expect(deleteStage(db, adminA(), stage.id)).rejects.toMatchObject({
      code: "STAGE_NOT_EMPTY",
    });
  });
});

describe("deals", () => {
  it("creates a deal and surfaces it on the kanban board", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Board", templateRef: "varejo" });
    const board = await getBoard(db, adminA(), funnel.id);
    const stage = board.stages[0]!;

    const deal = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: stage.id,
      contactId: contactA,
      title: "Orçamento Alice",
      valueCents: 19900,
      customAttributes: { origem: "whatsapp" },
    });

    const after = await getBoard(db, viewerA(), funnel.id);
    const card = after.stages[0]!.deals.find((d) => d.id === deal.id);
    expect(card?.contactName).toBe("Contato A");
    expect(card?.valueCents).toBe(19900);
    expect(card?.customAttributes).toEqual({ origem: "whatsapp" });
  });

  it("rejects a stage from another funnel", async () => {
    const f1 = await createFunnel(db, adminA(), { name: "F1" });
    const f2 = await createFunnel(db, adminA(), { name: "F2" });
    const stageF2 = await createStage(db, adminA(), { funnelId: f2.id, name: "S" });
    await expect(
      createDeal(db, agentA(), {
        funnelId: f1.id,
        stageId: stageF2.id,
        contactId: contactA,
        title: "x",
      }),
    ).rejects.toThrowError(NotFoundError);
  });

  it("converts a conversation into a deal exactly once", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Inbox" });
    const stage = await createStage(db, adminA(), { funnelId: funnel.id, name: "Novo" });

    const deal = await createDealFromConversation(db, agentA(), {
      conversationId: conversationA,
      funnelId: funnel.id,
      stageId: stage.id,
    });
    expect(deal.contactId).toBe(contactA);
    expect(deal.conversationId).toBe(conversationA);
    expect(deal.title).toBe("Contato A");

    const linked = await getDealForConversation(db, viewerA(), conversationA);
    expect(linked?.id).toBe(deal.id);
    expect(linked?.funnelName).toBe("Inbox");
    expect(linked?.stageName).toBe("Novo");

    await expect(
      createDealFromConversation(db, agentA(), {
        conversationId: conversationA,
        funnelId: funnel.id,
        stageId: stage.id,
      }),
    ).rejects.toMatchObject({ code: "CONVERSATION_ALREADY_LINKED" });

    await deleteDeal(db, adminA(), deal.id);
    expect(await getDealForConversation(db, adminA(), conversationA)).toBeNull();
  });

  it("moves a card between stages and renumbers positions", async () => {
    const funnel = await createFunnel(db, adminA(), { name: "Move" });
    const s1 = await createStage(db, adminA(), { funnelId: funnel.id, name: "A" });
    const s2 = await createStage(db, adminA(), { funnelId: funnel.id, name: "B" });
    const d1 = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: s1.id,
      contactId: contactA,
      title: "d1",
    });
    const d2 = await createDeal(db, agentA(), {
      funnelId: funnel.id,
      stageId: s1.id,
      contactId: contactA,
      title: "d2",
    });

    await moveDeal(db, agentA(), { dealId: d2.id, stageId: s2.id, position: 0 });
    const board = await getBoard(db, adminA(), funnel.id);
    const colA = board.stages.find((s) => s.id === s1.id)!.deals;
    const colB = board.stages.find((s) => s.id === s2.id)!.deals;
    expect(colA.map((d) => d.title)).toEqual(["d1"]);
    expect(colB.map((d) => d.title)).toEqual(["d2"]);
    expect(colA[0]!.position).toBe(0);
    expect(colB[0]!.position).toBe(0);

    // same-column reorder: put d1 above nothing else — stays position 0
    await moveDeal(db, agentA(), { dealId: d1.id, stageId: s1.id, position: 0 });
    expect(
      (await getBoard(db, adminA(), funnel.id)).stages.find((s) => s.id === s1.id)!.deals[0]!.id,
    ).toBe(d1.id);
  });
});
