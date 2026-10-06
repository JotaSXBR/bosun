// Integration test — requires Postgres with migrations applied.
// Outbound actions: provider sends, failed-send audit, private notes.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { FakeChannelProvider } from "@crm/channels/testing";
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TenantContext } from "../../tenant/context";
import { resolveConversation } from "./actions";
import { addInternalNote, sendOutboundMessage } from "./outbound";
import type { ConnectionRef } from "./service";
import { ingestChannelEvent, listConversationMessages } from "./service";

const { channelConnections, conversations, organizationMembers, organizations, users } = schema;

let db: Database;
let orgA: string;
let userId: string;
let agent2: string;
let connA: ConnectionRef;

function ctx(organizationId: string, role: TenantContext["role"]): TenantContext {
  return { organizationId, userId, role, isPlatformAdmin: false };
}

/** Ingests one inbound on connA/orgA and returns the resulting active ticket. */
async function newTicket(channelUserId: string, messageId: string, timestamp: Date) {
  await withTenant(db, orgA, (tx) =>
    ingestChannelEvent(tx, connA, {
      type: "message.received",
      externalMessageId: messageId,
      from: { channelUserId, displayName: "Act" },
      content: { type: "text", text: "hi" },
      timestamp,
    }),
  );
  return withTenant(db, orgA, async (tx) => {
    const [conv] = await tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.externalId, channelUserId),
          sql`${conversations.status} != 'resolved'`,
        ),
      );
    return conv!;
  });
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
  const inserted = await db
    .insert(users)
    .values([
      { name: "IT Out User", email: `it-out-${suffix}@crm.local` },
      { name: "IT Out Agent2", email: `it-out2-${suffix}@crm.local` },
    ])
    .returning({ id: users.id });
  userId = inserted[0]!.id;
  agent2 = inserted[1]!.id;
  const [org] = await db
    .insert(organizations)
    .values({ name: "Out IT A", slug: `out-a-${suffix}` })
    .returning({ id: organizations.id });
  orgA = org!.id;
  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId, role: "agent" },
    { organizationId: orgA, userId: agent2, role: "agent" },
  ]);
  connA = await withTenant(db, orgA, async (tx) => {
    const [row] = await tx
      .insert(channelConnections)
      .values({
        organizationId: orgA,
        kind: "waha",
        name: "IT WAHA",
        credentialsEncrypted: "not-used-in-these-tests",
        webhookToken: `tok-out-${suffix}`,
      })
      .returning();
    return { id: row!.id, organizationId: orgA, kind: row!.kind };
  });
});

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} = ${orgA}`);
  await db.delete(users).where(sql`${users.id} in (${userId}, ${agent2})`);
  await db.$client.end();
});

describe("sendOutboundMessage", () => {
  it("sends via provider, persists the reply, moves to waiting_customer", async () => {
    const ticket = await newTicket("out-1@c.us", "false_out1@c.us_1", new Date("2024-04-01"));
    const provider = new FakeChannelProvider();

    const message = await sendOutboundMessage(
      db,
      ctx(orgA, "agent"),
      { conversationId: ticket.id, text: "hello back" },
      { provider },
    );

    // Provider saw the domain-level outbound message, addressed to the chat.
    expect(provider.sentMessages).toHaveLength(1);
    expect(provider.sentMessages[0]!.to).toBe("out-1@c.us");
    expect(message.direction).toBe("outbound");
    expect(message.status).toBe("sent");
    expect(message.externalId).toMatch(/^fake-msg-\d+$/);
    expect(message.authorId).toBe(userId);
    expect(message.private).toBe(false);

    await withTenant(db, orgA, async (tx) => {
      const [conv] = await tx.select().from(conversations).where(eq(conversations.id, ticket.id));
      // Reply claims the ticket and waits on the customer.
      expect(conv!.status).toBe("waiting_customer");
      expect(conv!.assigneeId).toBe(userId);
      expect(conv!.firstResponseAt).not.toBeNull();
    });
  });

  it("stamps first_response_at once; another agent is rejected before the provider call", async () => {
    const ticket = await newTicket("out-2@c.us", "false_out2@c.us_1", new Date("2024-04-02"));
    const provider = new FakeChannelProvider();
    await sendOutboundMessage(
      db,
      ctx(orgA, "agent"),
      { conversationId: ticket.id, text: "one" },
      { provider },
    );
    const firstResponseAt = await withTenant(db, orgA, async (tx) => {
      const [conv] = await tx.select().from(conversations).where(eq(conversations.id, ticket.id));
      return conv!.firstResponseAt;
    });
    expect(firstResponseAt).not.toBeNull();

    // Second reply by the same assignee keeps the original stamp.
    await sendOutboundMessage(
      db,
      ctx(orgA, "agent"),
      { conversationId: ticket.id, text: "two" },
      { provider },
    );
    await withTenant(db, orgA, async (tx) => {
      const [conv] = await tx.select().from(conversations).where(eq(conversations.id, ticket.id));
      expect(conv!.firstResponseAt).toEqual(firstResponseAt);
    });

    // A different agent can't work the ticket — transfer is the path.
    const hijacker = new FakeChannelProvider();
    await expect(
      sendOutboundMessage(
        db,
        { ...ctx(orgA, "agent"), userId: agent2 },
        { conversationId: ticket.id, text: "hijack" },
        { provider: hijacker },
      ),
    ).rejects.toThrowError(/TICKET_ASSIGNED|transfer/i);
    expect(hijacker.sentMessages).toHaveLength(0);
  });

  it("provider failure keeps a failed message row and throws SEND_FAILED", async () => {
    const ticket = await newTicket("out-3@c.us", "false_out3@c.us_1", new Date("2024-04-03"));
    const provider = new FakeChannelProvider();
    provider.sendMessageError = new Error("session offline");

    await expect(
      sendOutboundMessage(
        db,
        ctx(orgA, "agent"),
        { conversationId: ticket.id, text: "will fail" },
        { provider },
      ),
    ).rejects.toThrowError(/SEND_FAILED|failed to send/i);

    const rows = await listConversationMessages(db, ctx(orgA, "agent"), {
      conversationId: ticket.id,
    });
    const failed = rows.find((m) => m.direction === "outbound");
    expect(failed?.status).toBe("failed");
    // Ticket state untouched by the failed send.
    await withTenant(db, orgA, async (tx) => {
      const [conv] = await tx.select().from(conversations).where(eq(conversations.id, ticket.id));
      expect(conv!.status).toBe("open");
    });
  });

  it("rejects resolved tickets before touching the provider", async () => {
    const ticket = await newTicket("out-4@c.us", "false_out4@c.us_1", new Date("2024-04-04"));
    await resolveConversation(db, ctx(orgA, "agent"), { conversationId: ticket.id });
    const provider = new FakeChannelProvider();

    await expect(
      sendOutboundMessage(
        db,
        ctx(orgA, "agent"),
        { conversationId: ticket.id, text: "too late" },
        { provider },
      ),
    ).rejects.toThrowError(/immutable|TICKET_RESOLVED/i);
    expect(provider.sentMessages).toHaveLength(0);
  });
});

describe("addInternalNote", () => {
  it("note is private, authored, never sent; resolved rejects it", async () => {
    const ticket = await newTicket("note-1@c.us", "false_n1@c.us_1", new Date("2024-04-05"));
    const provider = new FakeChannelProvider();

    const note = await addInternalNote(db, ctx(orgA, "agent"), {
      conversationId: ticket.id,
      text: "cliente pediu retorno amanhã",
    });
    expect(note.private).toBe(true);
    expect(note.authorId).toBe(userId);
    expect(note.direction).toBe("outbound");
    expect(provider.sentMessages).toHaveLength(0);
    const listed = await listConversationMessages(db, ctx(orgA, "agent"), {
      conversationId: ticket.id,
    });
    expect(listed.find((m) => m.id === note.id)?.authorName).toBe("IT Out User");
    expect(
      listed.filter((m) => m.direction === "inbound").every((m) => m.authorName === null),
    ).toBe(true);

    await resolveConversation(db, ctx(orgA, "agent"), { conversationId: ticket.id });
    await expect(
      addInternalNote(db, ctx(orgA, "agent"), { conversationId: ticket.id, text: "late" }),
    ).rejects.toThrowError(/immutable|TICKET_RESOLVED/i);
  });
});
