// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { createServer, type Server } from "node:http";

import { getServerEnv } from "@crm/config";
import { encryptJson } from "@crm/core/crypto";
import type { Database } from "@crm/db";
import { createDb, schema, sql, withServiceAccess, withTenant } from "@crm/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { channelReconcileHandler } from "./channel-messages-reconcile";

const { channelConnections, conversations, messages, organizations } = schema;

let db: Database;
let orgId: string;
let connectionId: string;
let waha: Server;

const ORIGINAL_KEY = process.env.CHANNEL_CREDENTIALS_KEY;
const ORIGINAL_APP_URL = process.env.APP_URL;
const ORIGINAL_DB_URL = process.env.DATABASE_URL;

const WAHA_MESSAGE = {
  id: "false_5511@c.us_BACKFILL1",
  from: "5511@c.us",
  body: "chegou enquanto estava fora",
  timestamp: 1_700_000_000,
  notifyName: "Alice",
};

function startWahaStub(): Promise<Server> {
  const server = createServer((req, res) => {
    const json = (value: unknown, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(value));
    };
    const path = req.url ?? "";
    if (path === "/api/sessions/it-reconcile" && req.method === "GET") {
      return json({ name: "it-reconcile", status: "WORKING" });
    }
    if (path === "/api/sessions/it-reconcile/me") {
      return json({ id: "5511999998888@c.us", pushName: "Loja" });
    }
    if (path.startsWith("/api/it-reconcile/chats/overview")) {
      return json([{ id: "5511@c.us", name: "Alice" }]);
    }
    if (path.startsWith("/api/messages")) {
      return json([WAHA_MESSAGE]);
    }
    json({ error: `unstubbed ${req.method} ${path}` }, 404);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

beforeAll(async () => {
  process.env.CHANNEL_CREDENTIALS_KEY = "b".repeat(64);
  process.env.APP_URL = "https://app.test";
  const env = getServerEnv();
  process.env.DATABASE_URL = env.database.url; // the handler uses getDb()
  db = createDb(env.database.url);
  await db.execute(sql`select 1`);

  waha = await startWahaStub();
  const port = (waha.address() as { port: number }).port;
  const [org] = await db
    .insert(organizations)
    .values({ name: "Reconcile IT", slug: `recon-${crypto.randomUUID().slice(0, 8)}` })
    .returning({ id: organizations.id });
  orgId = org!.id;
  await withServiceAccess(db, async (tx) => {
    const [conn] = await tx
      .insert(channelConnections)
      .values({
        organizationId: orgId,
        kind: "waha",
        name: "IT reconcile",
        status: "connected",
        credentialsEncrypted: encryptJson({
          baseUrl: `http://127.0.0.1:${port}`,
          apiKey: "it-key",
          webhookHmacKey: "it-hmac",
          session: "it-reconcile",
        }),
        webhookToken: `tok-recon-${crypto.randomUUID().slice(0, 8)}`,
      })
      .returning({ id: channelConnections.id });
    connectionId = conn!.id;
  });
});

afterAll(async () => {
  await new Promise((resolve) => waha.close(() => resolve(undefined)));
  await db.delete(organizations).where(sql`${organizations.id} = ${orgId}`);
  await db.$client.end();
  process.env.CHANNEL_CREDENTIALS_KEY = ORIGINAL_KEY;
  process.env.APP_URL = ORIGINAL_APP_URL;
  process.env.DATABASE_URL = ORIGINAL_DB_URL;
});

describe("channelReconcileHandler", () => {
  it("backfills missed messages once — deduped on re-run", async () => {
    const first = await channelReconcileHandler({
      organizationId: orgId,
      channelConnectionId: connectionId,
    });
    expect(first).toEqual({ connections: 1, listed: 1, ingested: 1 });

    const second = await channelReconcileHandler({
      organizationId: orgId,
      channelConnectionId: connectionId,
    });
    expect(second.ingested).toBe(0);

    await withTenant(db, orgId, async (tx) => {
      const rows = await tx
        .select()
        .from(messages)
        .where(sql`${messages.externalId} = ${WAHA_MESSAGE.id}`);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.direction).toBe("inbound");
      expect(rows[0]!.content).toEqual({
        type: "text",
        text: "chegou enquanto estava fora",
      });

      const [conv] = await tx
        .select()
        .from(conversations)
        .where(sql`${conversations.id} = ${rows[0]!.conversationId}`);
      expect(conv!.externalId).toBe("5511@c.us");
      expect(conv!.status).toBe("open");
    });
  });

  it("rejects a tampered payload (mismatched org/connection)", async () => {
    const result = await channelReconcileHandler({
      organizationId: orgId,
      channelConnectionId: crypto.randomUUID(),
    });
    expect(result.connections).toBe(0);
  });
});
