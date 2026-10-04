// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema, withTenant } from "@crm/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST } from "./route";

const { billingCustomers, billingPayments, billingWebhookEvents, organizations } = schema;

process.env.ASAAS_WEBHOOK_TOKEN = "it-route-webhook-token";
const WEBHOOK_TOKEN = "it-route-webhook-token";

let db: Database;
let orgId: string;
let customerExternalId: string;
let suffix: string;

function buildRequest(payload: unknown, token = WEBHOOK_TOKEN): Request {
  return new Request("http://localhost:3000/api/webhooks/billing/asaas", {
    method: "POST",
    headers: { "content-type": "application/json", "asaas-access-token": token },
    body: JSON.stringify(payload),
  });
}

beforeAll(async () => {
  const env = getServerEnv();
  db = createDb(env.database.url);
  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    throw new Error(
      `Integration tests require a migrated database. Run \`pnpm infra:up && pnpm db:migrate\` first.\nCause: ${(error as Error).message}`,
    );
  }

  suffix = crypto.randomUUID().slice(0, 8);
  const [org] = await db
    .insert(organizations)
    .values({ name: "Billing Hook IT", slug: `billhook-${suffix}` })
    .returning({ id: organizations.id });
  orgId = org!.id;
  customerExternalId = `cus_route_${suffix}`;
  await withTenant(db, orgId, (tx) =>
    tx.insert(billingCustomers).values({ organizationId: orgId, externalId: customerExternalId }),
  );
});

afterAll(async () => {
  await db.delete(organizations).where(sql`${organizations.id} = ${orgId}`);
  await db.$client.end();
});

describe("POST /api/webhooks/billing/asaas", () => {
  it("returns 401 for a bad asaas-access-token", async () => {
    const response = await POST(
      buildRequest({ id: "evt_x", event: "PAYMENT_CREATED" }, "wrong-token") as never,
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 for a body that is not a valid ASAAS envelope", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/billing/asaas", {
        method: "POST",
        headers: { "asaas-access-token": WEBHOOK_TOKEN },
        body: "not-json",
      }) as never,
    );
    expect(response.status).toBe(400);
  });

  it("processes a payment event, then acknowledges the replay as duplicate", async () => {
    const payload = {
      id: `evt_route_${suffix}`,
      event: "PAYMENT_CONFIRMED",
      payment: { id: `pay_route_${suffix}`, customer: customerExternalId, value: 49.9 },
    };
    const response = await POST(buildRequest(payload) as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, processed: true });

    const replay = await POST(buildRequest(payload) as never);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ ok: true, duplicate: true });

    await withTenant(db, orgId, async (tx) => {
      const events = await tx.select().from(billingWebhookEvents);
      expect(events).toHaveLength(1);
      const payments = await tx.select().from(billingPayments);
      expect(payments).toHaveLength(1);
      expect(payments[0]!.status).toBe("confirmed");
      expect(payments[0]!.amountCents).toBe(4990);
    });
  });
});
