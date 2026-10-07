// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import { encryptJson } from "@crm/core/crypto";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST as messagePOST } from "./message/route";
import { GET as messagesGET } from "./messages/route";
import { POST as sessionPOST } from "./session/route";
import { GET as streamGET } from "./stream/route";

const { channelConnections, conversations, messages, organizations } = schema;

process.env.CHANNEL_CREDENTIALS_KEY = "a".repeat(64);

let db: Database;
let orgId: string;
let connectionToken: string;
let sessionToken: string;

function post(url: string, body: unknown): NextRequest {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function get(url: string): NextRequest {
  return new Request(`http://localhost:3000${url}`) as NextRequest;
}

const PRE_FORM = { name: "Ana Rota", email: "ana@example.com", phone: "+55 11 91234-5678" };

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
  const [org] = await db
    .insert(organizations)
    .values({ name: "IT Widget", slug: `it-widget-${suffix}` })
    .returning();
  orgId = org!.id;
  connectionToken = `itw-${suffix}`;
  await withTenant(db, orgId, async (tx) => {
    await tx.insert(channelConnections).values({
      organizationId: orgId,
      kind: "site_chat",
      name: "IT Site",
      credentialsEncrypted: encryptJson({}),
      webhookToken: connectionToken,
      metadata: { welcomeText: "Bem-vindo!", accentColor: "#ff6600" },
    });
  });
});

afterAll(async () => {
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await db.$client.end();
});

describe("POST /api/widget/session", () => {
  it("creates a session and returns the widget config", async () => {
    const res = await sessionPOST(post("/api/widget/session", { connectionToken, ...PRE_FORM }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = (await res.json()) as {
      ok: boolean;
      sessionToken: string;
      config: { welcomeText: string; accentColor: string };
    };
    expect(body.ok).toBe(true);
    expect(body.sessionToken.length).toBeGreaterThan(20);
    expect(body.config).toMatchObject({ welcomeText: "Bem-vindo!", accentColor: "#ff6600" });
    sessionToken = body.sessionToken;
  });

  it("rejects invalid pre-form and unknown connection", async () => {
    const bad = await sessionPOST(
      post("/api/widget/session", { connectionToken, ...PRE_FORM, email: "nope" }),
    );
    expect(bad.status).toBe(400);
    const missing = await sessionPOST(
      post("/api/widget/session", { connectionToken: "nope", ...PRE_FORM }),
    );
    expect(missing.status).toBe(404);
  });
});

describe("POST /api/widget/message", () => {
  it("ingests a visitor message into a conversation", async () => {
    const res = await messagePOST(
      post("/api/widget/message", {
        sessionToken,
        text: "oi, preciso de ajuda",
        clientMessageId: "route-msg-1",
      }),
    );
    expect(res.status).toBe(200);
    const [conv] = await withTenant(db, orgId, (tx) =>
      tx.select().from(conversations).where(eq(conversations.externalId, "ana@example.com")),
    );
    expect(conv?.status).toBe("open");
    const [msg] = await withTenant(db, orgId, (tx) =>
      tx
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv!.id))
        .orderBy(messages.id)
        .limit(1),
    );
    expect(msg?.content).toMatchObject({ type: "text", text: "oi, preciso de ajuda" });
    expect(msg?.externalId).toBe("route-msg-1");
  });

  it("404s on unknown session and 400s on empty text", async () => {
    const res = await messagePOST(
      post("/api/widget/message", { sessionToken: "nope", text: "oi" }),
    );
    expect(res.status).toBe(404);
    const empty = await messagePOST(post("/api/widget/message", { sessionToken, text: "" }));
    expect(empty.status).toBe(400);
  });
});

describe("GET /api/widget/messages", () => {
  it("returns the visitor history and honors the after cursor", async () => {
    const res = await messagesGET(get(`/api/widget/messages?token=${sessionToken}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      conversation: { status: string };
      messages: { id: string; text: string }[];
    };
    expect(body.ok).toBe(true);
    expect(body.conversation.status).toBe("open");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0]?.text).toBe("oi, preciso de ajuda");

    const after = await messagesGET(
      get(`/api/widget/messages?token=${sessionToken}&after=${body.messages[0]?.id}`),
    );
    const afterBody = (await after.json()) as { messages: unknown[] };
    expect(afterBody.messages).toHaveLength(0);
  });

  it("requires a token and 404s on unknown", async () => {
    expect((await messagesGET(get("/api/widget/messages"))).status).toBe(400);
    expect((await messagesGET(get("/api/widget/messages?token=nope"))).status).toBe(404);
  });
});

describe("GET /api/widget/stream", () => {
  it("opens an SSE stream for a valid session", async () => {
    const res = await streamGET(get(`/api/widget/stream?token=${sessionToken}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const reader = res.body!.getReader();
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toContain("retry:");
    await reader.cancel();
  });

  it("400s without token and 404s on unknown", async () => {
    expect((await streamGET(get("/api/widget/stream"))).status).toBe(400);
    expect((await streamGET(get("/api/widget/stream?token=nope"))).status).toBe(404);
  });
});
