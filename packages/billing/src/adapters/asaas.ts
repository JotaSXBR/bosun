// Asaas REST adapter (https://docs.asaas.com). No SDK — plain fetch.
// Auth: `access_token` header (Asaas API key). Webhooks authenticate via the
// `asaas-access-token` header holding the token configured in the Asaas
// dashboard (NOT the API key); verification fails when no token configured.
// Values cross the boundary in reais; conversion to/from cents happens only
// here, with exact integer math.
import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import type {
  BillingEvent,
  BillingProvider,
  CreateCustomerInput,
  CreateSubscriptionInput,
  RawWebhookRequest,
} from "../domain";

export type AsaasConfig = {
  apiKey: string;
  /** "production" | "sandbox" */
  environment: "production" | "sandbox";
  webhookToken?: string | undefined;
};

export type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

const BASE_URLS: Record<AsaasConfig["environment"], string> = {
  production: "https://api.asaas.com/v3",
  sandbox: "https://api-sandbox.asaas.com/v3",
};

const customerSchema = z.looseObject({ id: z.string() });
const subscriptionSchema = z.looseObject({
  id: z.string(),
  status: z.string().optional(),
  deleted: z.boolean().optional(),
});

const webhookSchema = z.looseObject({
  id: z.string(),
  event: z.string(),
  dateCreated: z.string().optional(),
  payment: z.looseObject({ id: z.string().optional(), value: z.number().optional() }).optional(),
  subscription: z.looseObject({ id: z.string().optional() }).optional(),
});

const EVENT_MAP: Record<string, BillingEvent["type"]> = {
  PAYMENT_CREATED: "payment.created",
  PAYMENT_CONFIRMED: "payment.confirmed",
  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_OVERDUE: "payment.overdue",
  PAYMENT_REFUNDED: "payment.refunded",
  PAYMENT_DELETED: "payment.deleted",
  SUBSCRIPTION_DELETED: "subscription.canceled",
  SUBSCRIPTION_INACTIVATED: "subscription.canceled",
};

const BILLING_TYPE_MAP: Record<CreateSubscriptionInput["paymentMethod"], string> = {
  boleto: "BOLETO",
  pix: "PIX",
  credit_card: "CREDIT_CARD",
  undefined: "UNDEFINED",
};

export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

function toDueDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class AsaasBillingProvider implements BillingProvider {
  readonly kind = "asaas" as const;

  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly config: AsaasConfig,
    deps?: { fetch?: FetchLike },
  ) {
    this.baseUrl = BASE_URLS[config.environment];
    this.fetchImpl = deps?.fetch ?? fetch;
  }

  private headers(): Record<string, string> {
    return {
      access_token: this.config.apiKey,
      "Content-Type": "application/json",
      "User-Agent": "crm",
    };
  }

  async createCustomer(input: CreateCustomerInput): Promise<{ externalId: string }> {
    const res = await this.fetchImpl(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        cpfCnpj: input.document,
        externalReference: input.externalReference,
      }),
    });
    if (!res.ok) throw new Error(`Asaas createCustomer failed: HTTP ${res.status}`);
    return { externalId: customerSchema.parse(await res.json()).id };
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<{ externalId: string; status: "active" | "inactive" }> {
    const res = await this.fetchImpl(`${this.baseUrl}/subscriptions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        customer: input.customerExternalId,
        billingType: BILLING_TYPE_MAP[input.paymentMethod],
        value: centsToReais(input.amountCents),
        nextDueDate: toDueDate(input.nextDueDate),
        cycle: input.cycle === "monthly" ? "MONTHLY" : "YEARLY",
        description: input.description,
        externalReference: input.externalReference,
      }),
    });
    if (!res.ok) throw new Error(`Asaas createSubscription failed: HTTP ${res.status}`);
    const parsed = subscriptionSchema.parse(await res.json());
    const status =
      parsed.deleted === true || parsed.status === "INACTIVE" || parsed.status === "EXPIRED"
        ? "inactive"
        : "active";
    return { externalId: parsed.id, status };
  }

  async cancelSubscription(externalId: string): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/subscriptions/${externalId}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Asaas cancelSubscription failed: HTTP ${res.status}`);
    }
  }

  /** `asaas-access-token` header must equal the configured webhook token. */
  verifyWebhook(request: RawWebhookRequest): boolean {
    const expected = this.config.webhookToken;
    if (!expected) return false;
    const received = request.headers["asaas-access-token"] ?? "";
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(request: RawWebhookRequest): BillingEvent[] {
    let raw: unknown;
    try {
      raw = JSON.parse(request.rawBody);
    } catch {
      return [];
    }
    const parsed = webhookSchema.safeParse(raw);
    if (!parsed.success) return [];
    const type = EVENT_MAP[parsed.data.event];
    if (!type) return [];
    return [
      {
        eventId: parsed.data.id,
        type,
        ...(parsed.data.payment?.id ? { externalPaymentId: parsed.data.payment.id } : {}),
        ...(parsed.data.subscription?.id
          ? { externalSubscriptionId: parsed.data.subscription.id }
          : {}),
        ...(typeof parsed.data.payment?.value === "number"
          ? { amountCents: reaisToCents(parsed.data.payment.value) }
          : {}),
        occurredAt: parsed.data.dateCreated ? new Date(parsed.data.dateCreated) : new Date(),
      },
    ];
  }
}
