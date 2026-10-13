// Demo content seed — inserts seed-data.ts into the Demo org. Idempotent:
// every block keys off a natural id (contact channelUserId, conversation
// externalId, agent name, entry title) and skips what already exists.
import { type createDb, schema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";

import {
  DEMO_AGENTS,
  DEMO_CONTACTS,
  DEMO_DEALS,
  DEMO_KNOWLEDGE,
  DEMO_MEMORY,
  DEMO_USAGE,
  THREADS,
  type ThreadSpec,
  WIDGET_VISITORS,
} from "./seed-data";

type SeedDb = ReturnType<typeof createDb>;
type IdMap = ReadonlyMap<string, string>;

const {
  channelConnections,
  contacts,
  conversations,
  messages,
  teams,
  labels,
  conversationLabels,
  deals,
  dealLabels,
  funnelStages,
  funnels,
  agents,
  knowledgeEntries,
  memoryEntries,
  agentSuggestions,
  aiUsageEvents,
  siteChatSessions,
  ticketCounters,
} = schema;

function ts(daysAgo: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function ensureConnection(
  db: SeedDb,
  orgId: string,
  kind: string,
  name: string,
  webhookToken: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: channelConnections.id })
    .from(channelConnections)
    .where(eq(channelConnections.webhookToken, webhookToken))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(channelConnections)
    .values({
      organizationId: orgId,
      kind,
      name,
      externalRef: kind === "waha" ? "5511987654321" : "widget-bosun-io",
      status: "connected",
      credentialsEncrypted: "seed-placeholder-not-encrypted",
      webhookToken,
      connectedAt: ts(30),
    })
    .returning({ id: channelConnections.id });
  if (!created) throw new Error(`failed to seed connection ${name}`);
  return created.id;
}

async function ensureContacts(
  db: SeedDb,
  orgId: string,
): Promise<Map<string, { id: string; channelUserId: string }>> {
  const map = new Map<string, { id: string; channelUserId: string }>();
  const all = [
    ...DEMO_CONTACTS,
    ...WIDGET_VISITORS.map((v) => ({
      key: v.key,
      channelUserId: v.email,
      displayName: v.displayName,
    })),
  ];
  for (const c of all) {
    let [row] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.organizationId, orgId), eq(contacts.channelUserId, c.channelUserId)))
      .limit(1);
    if (!row) {
      [row] = await db
        .insert(contacts)
        .values({
          organizationId: orgId,
          channelUserId: c.channelUserId,
          displayName: c.displayName,
        })
        .returning({ id: contacts.id });
    }
    if (row) map.set(c.key, { id: row.id, channelUserId: c.channelUserId });
  }
  return map;
}

async function nextTicketNumber(db: SeedDb, orgId: string): Promise<number> {
  const [counter] = await db
    .insert(ticketCounters)
    .values({ organizationId: orgId, value: 1 })
    .onConflictDoUpdate({
      target: ticketCounters.organizationId,
      set: { value: sql`${ticketCounters.value} + 1` },
    })
    .returning({ value: ticketCounters.value });
  if (!counter) throw new Error("failed to increment ticket counter");
  return counter.value;
}

async function bumpContactTicket(db: SeedDb, contactId: string): Promise<number> {
  const [row] = await db
    .update(contacts)
    .set({ ticketCounter: sql`${contacts.ticketCounter} + 1`, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning({ seq: contacts.ticketCounter });
  return row?.seq ?? 1;
}

type ThreadCtx = {
  db: SeedDb;
  orgId: string;
  connId: Record<"waha" | "site", string>;
  contactMap: Map<string, { id: string; channelUserId: string }>;
  userIdByRole: IdMap;
  teamIdByName: IdMap;
  labelIdByName: IdMap;
  convIdBySuffix: Map<string, string>;
};

async function insertThreadMessages(
  ctx: ThreadCtx,
  t: ThreadSpec,
  convId: string,
  contactId: string,
): Promise<void> {
  for (const [i, m] of t.msgs.entries()) {
    await ctx.db.insert(messages).values({
      organizationId: ctx.orgId,
      conversationId: convId,
      channelConnectionId: ctx.connId[t.conn],
      contactId: m.dir === "inbound" ? contactId : null,
      direction: m.dir,
      content: { type: "text", text: m.text },
      externalId: `seed-msg-${t.externalSuffix}-${i}`,
      private: m.private ?? false,
      authorId:
        m.dir === "outbound" || m.private
          ? (ctx.userIdByRole.get(m.authorRole ?? "agent") ?? null)
          : null,
      status: m.status ?? (m.dir === "inbound" ? "received" : "delivered"),
      sentAt: ts(m.daysAgo, m.hour ?? 10, i * 4),
    });
  }
  for (const labelName of t.labels ?? []) {
    const labelId = ctx.labelIdByName.get(labelName);
    if (labelId) {
      await ctx.db
        .insert(conversationLabels)
        .values({ organizationId: ctx.orgId, conversationId: convId, labelId })
        .onConflictDoNothing();
    }
  }
}

async function insertConversationRow(
  ctx: ThreadCtx,
  t: ThreadSpec,
  connectionId: string,
  externalId: string,
  contactId: string,
): Promise<string | null> {
  const lastMsg = t.msgs[t.msgs.length - 1]!;
  const lastChannelMsg = [...t.msgs].reverse().find((m) => !m.private) ?? lastMsg;
  const firstReply = t.msgs.find((m) => m.dir === "outbound");
  const resolved = t.status === "resolved" || t.status === "closed";

  const [conv] = await ctx.db
    .insert(conversations)
    .values({
      organizationId: ctx.orgId,
      channelConnectionId: connectionId,
      contactId,
      externalId,
      status: t.status,
      sectorId: t.sector ? (ctx.teamIdByName.get(t.sector) ?? null) : null,
      assigneeId: t.assigneeRole ? (ctx.userIdByRole.get(t.assigneeRole) ?? null) : null,
      precededById: t.precededByKey ? (ctx.convIdBySuffix.get(t.precededByKey) ?? null) : null,
      ticketNumber: await nextTicketNumber(ctx.db, ctx.orgId),
      ticketSeq: await bumpContactTicket(ctx.db, contactId),
      resolvedAt: resolved ? ts(3, 17) : null,
      resolvedById: resolved ? (ctx.userIdByRole.get(t.assigneeRole ?? "agent") ?? null) : null,
      snoozedUntil: t.snoozedUntil ?? null,
      firstResponseAt: firstReply ? ts(firstReply.daysAgo, firstReply.hour ?? 9) : null,
      lastMessageAt: ts(lastMsg.daysAgo, lastMsg.hour ?? 10),
      lastMessagePreview: lastChannelMsg.text.slice(0, 140),
      lastMessageDirection: lastChannelMsg.dir,
      createdAt: ts(t.msgs[0]!.daysAgo, t.msgs[0]!.hour ?? 10),
    })
    .returning({ id: conversations.id });
  return conv?.id ?? null;
}

async function ensureOneThread(ctx: ThreadCtx, t: ThreadSpec): Promise<void> {
  const contact = ctx.contactMap.get(t.contactKey);
  if (!contact) return;
  const connectionId = ctx.connId[t.conn];
  const externalId = `seed-conv-${t.externalSuffix}`;

  const [existing] = await ctx.db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.channelConnectionId, connectionId),
        eq(conversations.externalId, externalId),
      ),
    )
    .limit(1);
  if (existing) {
    ctx.convIdBySuffix.set(t.externalSuffix, existing.id);
    return;
  }

  const convId = await insertConversationRow(ctx, t, connectionId, externalId, contact.id);
  if (!convId) return;
  ctx.convIdBySuffix.set(t.externalSuffix, convId);
  await insertThreadMessages(ctx, t, convId, contact.id);
}

async function ensureConversations(ctx: ThreadCtx): Promise<Map<string, string>> {
  for (const t of THREADS) {
    await ensureOneThread(ctx, t);
  }
  return ctx.convIdBySuffix;
}

async function ensureDeals(
  db: SeedDb,
  orgId: string,
  funnelId: string,
  ctx: Pick<ThreadCtx, "contactMap" | "convIdBySuffix" | "labelIdByName">,
): Promise<void> {
  const stageIdByName = new Map(
    (
      await db
        .select({ id: funnelStages.id, name: funnelStages.name })
        .from(funnelStages)
        .where(eq(funnelStages.funnelId, funnelId))
    ).map((s) => [s.name, s.id]),
  );

  for (const d of DEMO_DEALS) {
    const contact = ctx.contactMap.get(d.contactKey);
    const stageId = stageIdByName.get(d.stage);
    if (!contact || !stageId) continue;

    const [existing] = await db
      .select({ id: deals.id })
      .from(deals)
      .where(
        and(
          eq(deals.organizationId, orgId),
          eq(deals.contactId, contact.id),
          eq(deals.title, d.title),
        ),
      )
      .limit(1);
    if (existing) continue;

    const [deal] = await db
      .insert(deals)
      .values({
        organizationId: orgId,
        funnelId,
        stageId,
        contactId: contact.id,
        conversationId: "conv" in d ? (ctx.convIdBySuffix.get(d.conv) ?? null) : null,
        title: d.title,
        valueCents: d.valueCents,
        position: d.position,
      })
      .returning({ id: deals.id });

    for (const labelName of "labels" in d ? d.labels : []) {
      const labelId = ctx.labelIdByName.get(labelName);
      if (deal && labelId) {
        await db
          .insert(dealLabels)
          .values({ organizationId: orgId, dealId: deal.id, labelId })
          .onConflictDoNothing();
      }
    }
  }
}

async function ensureAgents(db: SeedDb, orgId: string): Promise<void> {
  for (const a of DEMO_AGENTS) {
    const [existing] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.organizationId, orgId), eq(agents.name, a.name)))
      .limit(1);
    if (existing) continue;
    await db.insert(agents).values({
      organizationId: orgId,
      name: a.name,
      specialty: a.specialty,
      status: a.status,
      kind: "org",
      systemPrompt: a.systemPrompt,
      businessRules: "businessRules" in a ? a.businessRules : null,
      signatureLine: "signatureLine" in a ? a.signatureLine : null,
    });
  }
}

async function ensureKnowledge(db: SeedDb, orgId: string): Promise<void> {
  for (const k of DEMO_KNOWLEDGE) {
    const [existing] = await db
      .select({ id: knowledgeEntries.id })
      .from(knowledgeEntries)
      .where(and(eq(knowledgeEntries.organizationId, orgId), eq(knowledgeEntries.title, k.title)))
      .limit(1);
    if (existing) continue;
    await db
      .insert(knowledgeEntries)
      .values({ organizationId: orgId, title: k.title, content: k.content });
  }
}

async function ensureMemory(db: SeedDb, orgId: string, ownerId: string): Promise<void> {
  for (const m of DEMO_MEMORY) {
    const [existing] = await db
      .select({ id: memoryEntries.id })
      .from(memoryEntries)
      .where(and(eq(memoryEntries.organizationId, orgId), eq(memoryEntries.content, m.content)))
      .limit(1);
    if (existing) continue;
    await db.insert(memoryEntries).values({
      organizationId: orgId,
      type: m.type,
      scope: "org",
      content: m.content,
      confidence: m.confidence,
      status: "canon",
      staleAfter: ts(-m.staleAfterDays),
      verifiedBy: ownerId,
      verifiedAt: ts(7),
    });
  }
}

async function ensureSuggestions(db: SeedDb, orgId: string, convIdBySuffix: IdMap): Promise<void> {
  const [any] = await db
    .select({ id: agentSuggestions.id })
    .from(agentSuggestions)
    .where(eq(agentSuggestions.organizationId, orgId))
    .limit(1);
  if (any) return;
  const ricardoConv = convIdBySuffix.get("ricardo") ?? null;
  await db.insert(agentSuggestions).values([
    {
      organizationId: orgId,
      targetType: "knowledge_entry",
      targetId: null,
      payload: {
        title: "Política de emissão de nota fiscal",
        content:
          "O Bosun não emite NF-e no produto. Para nota de serviço, encaminhe a solicitação ao financeiro informando CNPJ e plano contratado.",
      },
      rationale:
        "2 conversas recentes (Beto Campos, Ricardo Alves) perguntaram sobre NF-e e não há entrada de conhecimento cobrindo o tema.",
      status: "pending",
      sourceConversationId: convIdBySuffix.get("beto") ?? null,
      proposedBy: null,
    },
    {
      organizationId: orgId,
      targetType: "memory",
      targetId: null,
      payload: {
        type: "pattern",
        scope: "org",
        content:
          "Perguntas sobre isolamento/multi-tenant chegam de leads com 2+ unidades — indicador de fit Enterprise.",
        confidence: "medium",
        staleAfterDays: 90,
        sourceConversationIds: ricardoConv ? [ricardoConv] : [],
      },
      rationale: "Padrão observado em 3 conversas de prospects multi-unidade na última semana.",
      status: "pending",
      sourceConversationId: ricardoConv,
      proposedBy: null,
    },
  ]);
}

async function ensureUsage(db: SeedDb, orgId: string): Promise<void> {
  const [any] = await db
    .select({ id: aiUsageEvents.id })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.organizationId, orgId))
    .limit(1);
  if (any) return;
  for (const u of DEMO_USAGE) {
    await db.insert(aiUsageEvents).values({
      organizationId: orgId,
      callKind: u.callKind,
      provider: u.provider,
      model: u.model,
      tokensIn: u.tokensIn,
      tokensOut: u.tokensOut,
      latencyMs: u.latencyMs,
      status: "status" in u ? u.status : "ok",
      createdAt: ts(u.daysAgo, 8),
    });
  }
}

async function ensureWidgetSessions(
  db: SeedDb,
  orgId: string,
  siteConnId: string,
  contactMap: Map<string, { id: string }>,
): Promise<void> {
  for (const v of WIDGET_VISITORS) {
    const contact = contactMap.get(v.key);
    if (!contact) continue;
    const token = `seed-widget-${v.key}`;
    const [existing] = await db
      .select({ id: siteChatSessions.id })
      .from(siteChatSessions)
      .where(eq(siteChatSessions.token, token))
      .limit(1);
    if (existing) continue;
    await db.insert(siteChatSessions).values({
      organizationId: orgId,
      channelConnectionId: siteConnId,
      contactId: contact.id,
      token,
      lastSeenAt: ts(0, 9),
    });
  }
}

export async function ensureDemoContent(
  db: SeedDb,
  orgId: string,
  userIdByRole: IdMap,
): Promise<void> {
  const connId = {
    waha: await ensureConnection(db, orgId, "waha", "WhatsApp Comercial", "seed-waha-demo"),
    site: await ensureConnection(db, orgId, "site_chat", "Widget site bosun.io", "seed-site-demo"),
  };
  const contactMap = await ensureContacts(db, orgId);

  const teamIdByName = new Map(
    (
      await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(eq(teams.organizationId, orgId))
    ).map((t) => [t.name === "Vendas" ? "vendas" : "suporte", t.id]),
  );
  const labelIdByName = new Map(
    (
      await db
        .select({ id: labels.id, name: labels.name })
        .from(labels)
        .where(eq(labels.organizationId, orgId))
    ).map((l) => [l.name, l.id]),
  );

  const ctx: ThreadCtx = {
    db,
    orgId,
    connId,
    contactMap,
    userIdByRole,
    teamIdByName,
    labelIdByName,
    convIdBySuffix: new Map(),
  };
  const convIdBySuffix = await ensureConversations(ctx);

  const [funnel] = await db
    .select({ id: funnels.id })
    .from(funnels)
    .where(and(eq(funnels.organizationId, orgId), eq(funnels.name, "Pipeline Demo")))
    .limit(1);
  if (funnel) {
    await ensureDeals(db, orgId, funnel.id, { contactMap, convIdBySuffix, labelIdByName });
  }

  const ownerId = userIdByRole.get("owner") ?? [...userIdByRole.values()][0];
  await ensureAgents(db, orgId);
  await ensureKnowledge(db, orgId);
  if (ownerId) await ensureMemory(db, orgId, ownerId);
  await ensureSuggestions(db, orgId, convIdBySuffix);
  await ensureUsage(db, orgId);
  await ensureWidgetSessions(db, orgId, connId.site, contactMap);
}
