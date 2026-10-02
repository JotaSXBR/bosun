import { describe, expect, it } from "vitest";

import type { BillingProvider } from "../domain";
import { createBillingProvider } from "../registry";
import { FakeBillingProvider } from "../testing";
import type { FetchLike } from "./asaas";
import { AsaasBillingProvider, centsToReais, reaisToCents } from "./asaas";

function mockFetch(
  responder: (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ) => {
    status?: number;
    json?: unknown;
  },
): {
  fetch: FetchLike;
  calls: {
    url: string;
    init?: { method?: string; headers?: Record<string, string>; body?: string };
  }[];
} {
  const calls: {
    url: string;
    init?: { method?: string; headers?: Record<string, string>; body?: string };
  }[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    calls.push({ url, init });
    const res = responder(url, init);
    return Promise.resolve({
      ok: (res.status ?? 200) >= 200 && (res.status ?? 200) < 300,
      status: res.status ?? 200,
      json: () => Promise.resolve(res.json),
      text: () => Promise.resolve(JSON.stringify(res.json)),
    });
  };
  return { fetch: fetchImpl, calls };
}

const config = { apiKey: "key", environment: "sandbox" as const, webhookToken: "wh-token" };

describe("cents conversion", () => {
  it("round-trips without floating point drift", () => {
    expect(centsToReais(1999)).toBe(19.99);
    expect(reaisToCents(19.99)).toBe(1999);
    expect(reaisToCents(0.29)).toBe(29);
    expect(centsToReais(100)).toBe(1);
  });
});

describe("AsaasBillingProvider", () => {
  it("creates a customer with cpfCnpj + externalReference", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { id: "cus_1" } }));
    const provider = new AsaasBillingProvider(config, { fetch: fetchImpl });
    const result = await provider.createCustomer({
      name: "Org",
      email: "a@b.c",
      document: "12345678901",
      externalReference: "org-id",
    });
    expect(result.externalId).toBe("cus_1");
    const call = calls[0];
    expect(call?.url).toBe("https://api-sandbox.asaas.com/v3/customers");
    expect(call?.init?.headers?.access_token).toBe("key");
    expect(call?.init?.headers?.["User-Agent"]).toBe("crm");
    expect(JSON.parse(call?.init?.body ?? "{}")).toMatchObject({
      name: "Org",
      cpfCnpj: "12345678901",
      externalReference: "org-id",
    });
  });

  it("creates a subscription with reais value and billingType", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({
      json: { id: "sub_1", status: "ACTIVE" },
    }));
    const provider = new AsaasBillingProvider(config, { fetch: fetchImpl });
    const result = await provider.createSubscription({
      customerExternalId: "cus_1",
      amountCents: 19990,
      cycle: "monthly",
      nextDueDate: new Date("2025-02-01T12:00:00Z"),
      paymentMethod: "pix",
      externalReference: "plan-1",
    });
    expect(result).toEqual({ externalId: "sub_1", status: "active" });
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toMatchObject({
      customer: "cus_1",
      billingType: "PIX",
      value: 199.9,
      nextDueDate: "2025-02-01",
      cycle: "MONTHLY",
    });
  });

  it("cancels via DELETE /subscriptions/{id}", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const provider = new AsaasBillingProvider(config, { fetch: fetchImpl });
    await provider.cancelSubscription("sub_1");
    expect(calls[0]?.url).toBe("https://api-sandbox.asaas.com/v3/subscriptions/sub_1");
    expect(calls[0]?.init?.method).toBe("DELETE");
  });

  it("verifies webhook token with timing-safe comparison", () => {
    const provider = new AsaasBillingProvider(config);
    const req = {
      rawBody: "{}",
      headers: { "asaas-access-token": "wh-token" },
      query: {},
    };
    expect(provider.verifyWebhook(req)).toBe(true);
    expect(provider.verifyWebhook({ ...req, headers: { "asaas-access-token": "nope" } })).toBe(
      false,
    );
    expect(provider.verifyWebhook({ ...req, headers: {} })).toBe(false);
    // unconfigured → refuse
    expect(
      new AsaasBillingProvider({ ...config, webhookToken: undefined }).verifyWebhook(req),
    ).toBe(false);
  });

  it("maps payment events and carries the event id for idempotency", () => {
    const provider = new AsaasBillingProvider(config);
    const payload = {
      id: "evt_1",
      event: "PAYMENT_RECEIVED",
      dateCreated: "2024-06-12 16:45:03",
      payment: { id: "pay_1", value: 19.99 },
      subscription: { id: "sub_1" },
    };
    const [event] = provider.parseWebhook({
      rawBody: JSON.stringify(payload),
      headers: {},
      query: {},
    });
    expect(event).toMatchObject({
      eventId: "evt_1",
      type: "payment.received",
      externalPaymentId: "pay_1",
      externalSubscriptionId: "sub_1",
      amountCents: 1999,
    });
  });

  it("maps subscription deletion/inactivation to subscription.canceled and drops unknown", () => {
    const provider = new AsaasBillingProvider(config);
    const canceled = provider.parseWebhook({
      rawBody: JSON.stringify({
        id: "e1",
        event: "SUBSCRIPTION_DELETED",
        subscription: { id: "s1" },
      }),
      headers: {},
      query: {},
    });
    expect(canceled[0]?.type).toBe("subscription.canceled");
    const inactivated = provider.parseWebhook({
      rawBody: JSON.stringify({
        id: "e2",
        event: "SUBSCRIPTION_INACTIVATED",
        subscription: { id: "s1" },
      }),
      headers: {},
      query: {},
    });
    expect(inactivated[0]?.type).toBe("subscription.canceled");
    expect(
      provider.parseWebhook({
        rawBody: JSON.stringify({ id: "e3", event: "TRANSFER_CREATED" }),
        headers: {},
        query: {},
      }),
    ).toEqual([]);
    expect(provider.parseWebhook({ rawBody: "garbage", headers: {}, query: {} })).toEqual([]);
  });
});

describe("FakeBillingProvider via interface", () => {
  it("records calls through BillingProvider", async () => {
    const provider: BillingProvider = new FakeBillingProvider();
    const customer = await provider.createCustomer({
      name: "n",
      email: "e@x",
      document: "1",
      externalReference: "org",
    });
    const sub = await provider.createSubscription({
      customerExternalId: customer.externalId,
      amountCents: 100,
      cycle: "yearly",
      nextDueDate: new Date("2025-01-01"),
      paymentMethod: "boleto",
      externalReference: "org",
    });
    await provider.cancelSubscription(sub.externalId);
    const fake = provider as FakeBillingProvider;
    expect(fake.customers).toHaveLength(1);
    expect(fake.canceled).toEqual([sub.externalId]);
  });
});

describe("registry", () => {
  it("creates asaas provider", () => {
    expect(createBillingProvider({ kind: "asaas", ...config }).kind).toBe("asaas");
  });
});
