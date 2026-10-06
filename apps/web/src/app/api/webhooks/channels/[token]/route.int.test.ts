// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { createHmac } from "node:crypto";

import { getServerEnv } from "@crm/config";
import { encryptJson } from "@crm/core/crypto";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST } from "./route";

const { channelConnections, contacts, conversations, messages, organizations } = schema;

process.env.CHANNEL_CREDENTIALS_KEY = "a".repeat(64);

const HMAC_SECRET = "webhook-hmac-secret";

// Same shape WAHA posts for an inbound message (see waha adapter fixtures).
const wahaMessagePayload = {
  event: "message",
  session: "default",
  timestamp: 1704067200000,
  payload: {
    id: "false_1234567890@c.us_ROUTE1",
    timestamp: 1704067200,
    from: "1234567890@c.us",
    to: "9876543210@c.us",
    body: "Hello via route!",
    fromMe: false,
    hasMedia: false,
    notifyName: "Route Alice",
  },
};

let db: Database;
let orgId: string;
let webhookToken: string;

function wahaRequest(token: string, payload: unknown, secret = HMAC_SECRET): Request {
  return buildRequest(token, JSON.stringify(payload), secret);
}

function buildRequest(token: string, rawBody: string, secret?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["x-webhook-hmac"] = hmacSha512(rawBody, secret);
    headers["x-webhook-hmac-algorithm"] = "sha512";
  }
  return new Request(`http://localhost:3000/api/webhooks/channels/${token}`, {
    method: "POST",
    headers,
    body: rawBody,
  });
}

function hmacSha512(body: string, secret: string): string {
  return createHmac("sha512", secret).update(body).digest("hex");
}

async function callPost(request: Request, token: string): Promise<Response> {
  return POST(request as never, { params: Promise.resolve({ token }) });
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
  const [org] = await db
    .insert(organizations)
    .values({ name: "Webhook IT Org", slug: `hook-${suffix}` })
    .returning({ id: organizations.id });
  orgId = org!.id;
  webhookToken = `tok-${suffix}`;

  await withTenant(db, orgId, async (tx) => {
    await tx.insert(channelConnections).values({
      organizationId: orgId,
      kind: "waha",
      name: "IT connection",
      credentialsEncrypted: encryptJson({
        baseUrl: "http://waha.local:3001",
        apiKey: "waha-api-key",
        webhookHmacKey: HMAC_SECRET,
        session: "default",
      }),
      webhookToken,
      status: "connected",
    });
  });
});

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} = ${orgId}`);
  await db.$client.end();
});

describe("POST /api/webhooks/channels/[token]", () => {
  it("verifies, parses and persists an inbound message — replay is idempotent", async () => {
    const request = wahaRequest(webhookToken, wahaMessagePayload);
    const response = await callPost(request, webhookToken);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, processed: 1 });

    await withTenant(db, orgId, async (tx) => {
      const msgs = await tx.select().from(messages);
      expect(msgs).toHaveLength(1);
      expect(msgs[0]!.externalId).toBe("false_1234567890@c.us_ROUTE1");
      expect(msgs[0]!.direction).toBe("inbound");
      const [contact] = await tx.select().from(contacts);
      expect(contact!.displayName).toBe("Route Alice");
      const [conv] = await tx.select().from(conversations);
      expect(conv!.externalId).toBe("1234567890@c.us");
    });

    // Provider replay: same signed body → still a single message row.
    const replay = await callPost(wahaRequest(webhookToken, wahaMessagePayload), webhookToken);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ ok: true, processed: 1 });
    await withTenant(db, orgId, async (tx) => {
      expect(await tx.select().from(messages)).toHaveLength(1);
    });
  });

  it("returns 404 for an unknown webhook token (no leak)", async () => {
    const response = await callPost(
      wahaRequest("tok-does-not-exist", wahaMessagePayload),
      "tok-does-not-exist",
    );
    expect(response.status).toBe(404);
  });

  it("returns 401 for a bad signature", async () => {
    const request = wahaRequest(webhookToken, wahaMessagePayload, "wrong-secret");
    const response = await callPost(request, webhookToken);
    expect(response.status).toBe(401);
  });

  it("acknowledges unknown events with 200 (processed: 0)", async () => {
    const request = wahaRequest(webhookToken, {
      event: "engine.event",
      session: "default",
      payload: {},
    });
    const response = await callPost(request, webhookToken);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, processed: 0 });
  });
});
