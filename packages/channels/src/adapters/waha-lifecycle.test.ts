// WAHA session lifecycle tests — webhook registration, pairing, health
// info and the reconciler list endpoints.
import { describe, expect, it } from "vitest";

import { mockFetch, wahaRequest } from "./test-utils";
import { WahaChannelProvider } from "./waha";

const wahaConfig = {
  baseUrl: "https://waha.example.com/",
  apiKey: "key-1",
  session: "default",
  webhookHmacKey: "hmac-secret",
};

describe("WahaChannelProvider — session lifecycle", () => {
  it("ignores brief-2 events until they are parsed", () => {
    const provider = new WahaChannelProvider(wahaConfig);
    for (const event of [
      "message.reaction",
      "message.edited",
      "message.revoked",
      "presence.update",
    ]) {
      const req = wahaRequest({ event, session: "default", payload: {} });
      expect(provider.parseWebhook(req)).toEqual([]);
    }
  });

  it("registers the session webhook with hmac and exponential retries on create", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url, init) => {
      if (url.endsWith("/api/sessions/default") && init?.method !== "PUT") {
        return { status: 404 };
      }
      if (url.endsWith("/api/sessions") && init?.method === "POST") {
        return { json: { name: "default", status: "STARTING" } };
      }
      return { json: { name: "default", status: "WORKING" } };
    });
    const provider = new WahaChannelProvider(
      { ...wahaConfig, webhookUrl: "https://app.example.com/api/webhooks/channels/tok" },
      { fetch: fetchImpl },
    );
    await provider.connect();
    const create = calls.find((c) => c.url.endsWith("/api/sessions") && c.init?.method === "POST");
    const body = JSON.parse(create?.init?.body ?? "{}") as {
      config?: { webhooks?: Record<string, unknown>[] };
    };
    const webhook = body.config?.webhooks?.[0];
    expect(webhook).toMatchObject({
      url: "https://app.example.com/api/webhooks/channels/tok",
      events: [
        "message",
        "message.ack",
        "message.reaction",
        "message.edited",
        "message.revoked",
        "session.status",
        "presence.update",
      ],
      hmac: { key: "hmac-secret" },
      retries: { policy: "exponential", delaySeconds: 5, attempts: 8 },
    });
  });

  it("re-registers webhooks via PUT on an existing session (full replace)", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("/api/sessions/default")
        ? { json: { name: "default", status: "WORKING" } }
        : { json: {} },
    );
    const provider = new WahaChannelProvider(
      { ...wahaConfig, webhookUrl: "https://app.example.com/hook" },
      { fetch: fetchImpl },
    );
    await provider.connect();
    const put = calls.find((c) => c.init?.method === "PUT");
    expect(put?.url).toBe("https://waha.example.com/api/sessions/default");
    const body = JSON.parse(put?.init?.body ?? "{}") as { name?: string };
    expect(body.name).toBe("default");
  });

  it("requests a pairing code", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { code: "ABCD-1234" } }));
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    const result = await provider.requestPairingCode("5511999999999");
    expect(result.code).toBe("ABCD-1234");
    const call = calls[0];
    expect(call?.url).toBe("https://waha.example.com/api/default/auth/request-code");
    expect(JSON.parse(call?.init?.body ?? "{}")).toEqual({ phoneNumber: "5511999999999" });
  });

  it("reads session info with phone and warnings from /me", async () => {
    const { fetch: fetchImpl } = mockFetch((url) => {
      if (url.endsWith("/me")) {
        return {
          json: {
            id: "5511987654321@c.us",
            pushName: "Loja",
            reachoutTimelock: { timeEnforcementEnds: 1 },
            messageCapping: { state: "FIRST_WARNING" },
          },
        };
      }
      return { json: { name: "default", status: "WORKING" } };
    });
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    const info = await provider.getSessionInfo();
    expect(info).toEqual({
      status: "connected",
      phone: "5511987654321",
      pushName: "Loja",
      warnings: ["reachout_timelock", "message_capping:first_warning"],
    });
  });

  it("reads server version/engine", async () => {
    const { fetch: fetchImpl } = mockFetch(() => ({
      json: { version: "2026.9.1", engine: "GOWS", tier: "CORE" },
    }));
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    expect(await provider.getServerInfo()).toEqual({
      version: "2026.9.1",
      engine: "GOWS",
      tier: "CORE",
    });
  });

  it("lists chats filtering groups/broadcasts and mapping lastMessageAt", async () => {
    const { fetch: fetchImpl } = mockFetch(() => ({
      json: [
        { id: "5511@c.us", name: "Ana", lastMessage: { timestamp: 1700000000 } },
        { id: "g1@g.us", name: "Grupo" },
        { id: "b1@broadcast" },
      ],
    }));
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    const chats = await provider.listChats();
    expect(chats).toEqual([
      { id: "5511@c.us", name: "Ana", lastMessageAt: new Date(1700000000 * 1000) },
    ]);
  });

  it("lists messages for the reconciler, skipping fromMe", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({
      json: [
        { id: "m1", from: "5511@c.us", body: "oi", timestamp: 1700000000 },
        { id: "m2", from: "5511@c.us", body: "mine", fromMe: true, timestamp: 1700000001 },
      ],
    }));
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    const messages = await provider.listMessages("5511@c.us", { limit: 50 });
    expect(calls[0]?.url).toContain(
      "/api/messages?chatId=5511%40c.us&limit=50&offset=0&session=default",
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      externalMessageId: "m1",
      from: { channelUserId: "5511@c.us" },
      content: { type: "text", text: "oi" },
    });
  });

  it("logout and restart hit the session endpoints", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const provider = new WahaChannelProvider(wahaConfig, { fetch: fetchImpl });
    await provider.logout();
    await provider.restart();
    expect(calls[0]?.url).toBe("https://waha.example.com/api/sessions/default/logout");
    expect(calls[1]?.url).toBe("https://waha.example.com/api/sessions/default/restart");
  });
});
