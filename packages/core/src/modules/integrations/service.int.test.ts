// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { createServer, type Server } from "node:http";

import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, sql } from "@crm/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { decryptJson } from "../../lib/crypto";
import type { TenantContext } from "../../tenant/context";
import {
  createChannelConnection,
  refreshConnectionStatus,
  requestConnectionPairingCode,
} from "./service";

const { organizations, users } = schema;

let db: Database;
let orgId: string;
let userId: string;

const ORIGINAL_KEY = process.env.CHANNEL_CREDENTIALS_KEY;
const ORIGINAL_APP_URL = process.env.APP_URL;

function ctx(role: TenantContext["role"]): TenantContext {
  return { organizationId: orgId, userId, role, isPlatformAdmin: false };
}

/**
 * Minimal WAHA stub — records requests and answers the endpoints the
 * adapter's connect flow touches. `sessionStatus` lets each test steer
 * the lifecycle; `requests` is asserted after the run.
 */
type Stub = {
  url: string;
  requests: { method: string; path: string; body?: unknown }[];
  sessionStatus: string;
  close: () => Promise<void>;
};

type StubReply = { status: number; value?: unknown; png?: Buffer };

/** WAHA route table — anything not listed answers 404 so a wrong call
 *  surfaces immediately in the test run. */
function stubRoute(method: string, path: string, sessionStatus: string): StubReply {
  if (method === "PUT" && path.startsWith("/api/sessions/")) return { status: 200, value: {} };
  if (method === "GET" && path.endsWith("/auth/qr")) {
    return { status: 200, png: Buffer.from("89504e47", "hex") };
  }
  const session = { name: "it-session", status: sessionStatus };
  const table: Record<string, StubReply> = {
    "GET /api/sessions?all=true": { status: 200, value: [session] },
    "GET /api/sessions/it-session": { status: 200, value: session },
    "GET /api/sessions/it-session/me": {
      status: 200,
      value: { id: "5511999998888@c.us", pushName: "Loja IT" },
    },
    "POST /api/sessions": { status: 201, value: {} },
    "POST /api/sessions/it-session/start": { status: 200, value: {} },
    "POST /api/it-session/auth/request-code": { status: 200, value: { code: "ABCD-EFGH" } },
    "GET /api/server/version": { status: 200, value: { version: "2026.1.0", engine: "GOWS" } },
  };
  return (
    table[`${method} ${path}`] ?? { status: 404, value: { error: `unstubbed ${method} ${path}` } }
  );
}

async function startWahaStub(sessionStatus: string): Promise<Stub> {
  const requests: Stub["requests"] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const method = req.method ?? "";
      const path = req.url ?? "";
      const raw = Buffer.concat(chunks).toString("utf8");
      requests.push({ method, path, body: raw ? (JSON.parse(raw) as unknown) : undefined });
      const reply = stubRoute(method, path, sessionStatus);
      if (reply.png) {
        res.writeHead(reply.status, { "content-type": "image/png" });
        return res.end(reply.png);
      }
      res.writeHead(reply.status, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.value));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    sessionStatus,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

async function createWahaConnection(baseUrl: string, session?: string) {
  return createChannelConnection(db, ctx("owner"), {
    kind: "waha",
    name: "IT WAHA",
    credentials: {
      baseUrl,
      apiKey: "it-key",
      webhookHmacKey: "it-hmac",
      ...(session ? { session } : {}),
    },
  });
}

let stub: Stub;

beforeAll(async () => {
  process.env.CHANNEL_CREDENTIALS_KEY = "a".repeat(64);
  process.env.APP_URL = "https://app.test";
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
  const [user] = await db
    .insert(users)
    .values({ name: "IT User", email: `it-int-${suffix}@crm.local` })
    .returning({ id: users.id });
  userId = user!.id;
  const [org] = await db
    .insert(organizations)
    .values({ name: "Int IT", slug: `int-${suffix}` })
    .returning({ id: organizations.id });
  orgId = org!.id;
  stub = await startWahaStub("WORKING");
});

afterAll(async () => {
  await stub.close();
  await db.delete(organizations).where(sql`${organizations.id} = ${orgId}`);
  await db.delete(users).where(sql`${users.id} = ${userId}`);
  await db.$client.end();
  process.env.CHANNEL_CREDENTIALS_KEY = ORIGINAL_KEY;
  process.env.APP_URL = ORIGINAL_APP_URL;
});

describe("createChannelConnection", () => {
  it("assigns a conn_* session when none is given", async () => {
    const conn = await createWahaConnection(stub.url);
    const credentials = decryptJson<{ session?: string }>(conn.credentialsEncrypted);
    expect(credentials.session).toMatch(/^conn_[0-9a-f]{16}$/);
  });

  it("keeps a user-chosen session name", async () => {
    const conn = await createWahaConnection(stub.url, "loja-principal");
    const credentials = decryptJson<{ session?: string }>(conn.credentialsEncrypted);
    expect(credentials.session).toBe("loja-principal");
  });
});

describe("refreshConnectionStatus (WAHA connect)", () => {
  it("registers the session webhook and reports connected + paired phone", async () => {
    const conn = await createWahaConnection(stub.url, "it-session");
    const result = await refreshConnectionStatus(db, ctx("owner"), conn.id);

    expect(result.status).toBe("connected");
    expect(result.connection.externalRef).toBe("5511999998888");

    // The session update carried the full webhook config — per-connection
    // URL, all subscribed events and the HMAC key.
    const put = stub.requests.find(
      (r) => r.method === "PUT" && r.path === "/api/sessions/it-session",
    );
    expect(put).toBeDefined();
    const body = put!.body as {
      config: { webhooks: { url: string; events: string[]; hmac?: { key: string } }[] };
    };
    expect(body.config.webhooks).toHaveLength(1);
    const hook = body.config.webhooks[0]!;
    expect(hook.url).toBe(`https://app.test/api/webhooks/channels/${conn.webhookToken}`);
    expect(hook.hmac?.key).toBe("it-hmac");
    expect(hook.events).toEqual(
      expect.arrayContaining([
        "message",
        "message.ack",
        "message.reaction",
        "message.edited",
        "message.revoked",
        "session.status",
        "presence.update",
      ]),
    );
  });

  it("returns the QR code while the session waits for a scan", async () => {
    const scanStub = await startWahaStub("SCAN_QR_CODE");
    try {
      const conn = await createWahaConnection(scanStub.url, "it-session");
      const result = await refreshConnectionStatus(db, ctx("owner"), conn.id);
      expect(result.status).toBe("connecting");
      expect(result.qrCode?.mimeType).toBe("image/png");
      expect(typeof result.qrCode?.data).toBe("string");
    } finally {
      await scanStub.close();
    }
  });

  it("issues a pairing code for a phone number", async () => {
    const conn = await createWahaConnection(stub.url, "it-session");
    const { code } = await requestConnectionPairingCode(db, ctx("owner"), conn.id, "5511999998888");
    expect(code).toBe("ABCD-EFGH");
    const request = stub.requests.find((r) => r.path.endsWith("/auth/request-code"));
    expect(request?.body).toEqual({ phoneNumber: "5511999998888" });
  });
});
