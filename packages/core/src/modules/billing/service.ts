import type { BillingProvider, RawWebhookRequest } from "@crm/billing";
import { createBillingProvider } from "@crm/billing";
import type { Database, DbExecutor } from "@crm/db";
import { withServiceAccess } from "@crm/db";
import { createLogger } from "@crm/observability";

import { DomainError, WebhookVerificationError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { BillingCustomerRow, BillingPaymentRow, BillingSubscriptionRow } from "./repository";
import {
  findBillingCustomerByExternalId,
  findBillingCustomerByOrg,
  findBillingSubscriptionForOrg,
  findSubscriptionIdByExternalId,
  insertBillingCustomer,
  insertWebhookEvent,
  listBillingPaymentsForOrg,
  markWebhookEventProcessed,
  upsertBillingPayment,
} from "./repository";
import type {
  AsaasWebhookPayload,
  EnsureBillingCustomerInput,
  ListBillingPaymentsInput,
} from "./schemas";
import {
  asaasWebhookPayload,
  ensureBillingCustomerInput,
  listBillingPaymentsInput,
} from "./schemas";

const logger = createLogger({ bindings: { component: "billing-webhook" } });

/** Stored billing_payments.status values, mapped from ASAAS event names. */
export const ASAAS_PAYMENT_STATUS = {
  PAYMENT_CREATED: "pending",
  PAYMENT_CONFIRMED: "confirmed",
  PAYMENT_RECEIVED: "received",
  PAYMENT_OVERDUE: "overdue",
  PAYMENT_REFUNDED: "refunded",
  PAYMENT_DELETED: "deleted",
} as const;

export type BillingPaymentStatus = (typeof ASAAS_PAYMENT_STATUS)[keyof typeof ASAAS_PAYMENT_STATUS];

/** Pure mapping: ASAAS event type → stored payment status (undefined = not a payment event). */
export function paymentStatusForAsaasEvent(eventType: string): BillingPaymentStatus | undefined {
  return (ASAAS_PAYMENT_STATUS as Record<string, BillingPaymentStatus>)[eventType];
}

export type AsaasWebhookResult = {
  ok: boolean;
  /** Event id was already recorded — ASAAS replay, nothing reprocessed. */
  duplicate?: boolean;
  /** Event row was recorded and processed (payment upserted when resolvable). */
  processed?: boolean;
};

/**
 * Platform-level ASAAS webhook pipeline: verify the `asaas-access-token`
 * header against ASAAS_WEBHOOK_TOKEN (timing-safe, inside the provider), parse
 * the envelope, then — under service scope — record the event (dedup on
 * event_id), resolve the tenant via billing_customers.external_id, upsert the
 * payment and mark the event processed. All in one transaction.
 */
export async function handleAsaasWebhook(
  db: Database,
  request: RawWebhookRequest,
): Promise<AsaasWebhookResult> {
  const provider = billingProviderFromEnv();
  if (!provider.verifyWebhook(request)) {
    throw new WebhookVerificationError();
  }
  const payload = parseAsaasPayload(request.rawBody);
  return withServiceAccess(db, (tx) => processAsaasPayload(tx, payload));
}

async function processAsaasPayload(
  tx: DbExecutor,
  payload: AsaasWebhookPayload,
): Promise<AsaasWebhookResult> {
  const event = await insertWebhookEvent(tx, {
    eventId: payload.id,
    eventType: payload.event,
    payload,
  });
  if (!event) return { ok: true, duplicate: true };
  const customer = payload.payment?.customer
    ? await findBillingCustomerByExternalId(tx, payload.payment.customer)
    : undefined;
  const organizationId = customer?.organizationId ?? null;
  await upsertPaymentFromPayload(tx, payload, organizationId);
  await markWebhookEventProcessed(tx, payload.id, organizationId);
  return { ok: true, processed: true };
}

/**
 * Upserts billing_payments for payment events. Skipped (event still recorded)
 * when the event isn't a payment status change, the payload has no payment id,
 * the customer can't be resolved to an org, or the value is missing.
 */
async function upsertPaymentFromPayload(
  tx: DbExecutor,
  payload: AsaasWebhookPayload,
  organizationId: string | null,
): Promise<void> {
  const status = paymentStatusForAsaasEvent(payload.event);
  const payment = payload.payment;
  if (!status || !payment?.id) return;
  if (!organizationId || typeof payment.value !== "number") {
    logger.warn("billing webhook: payment event not recordable", {
      eventId: payload.id,
      eventType: payload.event,
      organizationResolved: organizationId !== null,
    });
    return;
  }
  const billingSubscriptionId = payment.subscription
    ? ((await findSubscriptionIdByExternalId(tx, payment.subscription)) ?? null)
    : null;
  await upsertBillingPayment(tx, {
    organizationId,
    billingSubscriptionId,
    externalId: payment.id,
    status,
    // Reais → integer cents (same exact math as the adapter's reaisToCents).
    amountCents: Math.round(payment.value * 100),
    dueDate: payment.dueDate ?? null,
    paidAt: paidAtFor(status, payment),
  });
}

function paidAtFor(
  status: BillingPaymentStatus,
  payment: NonNullable<AsaasWebhookPayload["payment"]>,
): Date | null {
  if (status !== "received") return null;
  const receivedAt = payment.paymentDate ?? payment.clientPaymentDate;
  return receivedAt ? new Date(receivedAt) : new Date();
}

function parseAsaasPayload(rawBody: string): AsaasWebhookPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    throw new DomainError("INVALID_WEBHOOK_PAYLOAD", "ASAAS webhook body is not valid JSON");
  }
  const parsed = asaasWebhookPayload.safeParse(raw);
  if (!parsed.success) {
    throw new DomainError("INVALID_WEBHOOK_PAYLOAD", "ASAAS webhook payload failed validation");
  }
  return parsed.data;
}

/**
 * Provider built from env — a single platform-level ASAAS account. Reads
 * process.env directly (same precedent as lib/crypto.ts with
 * CHANNEL_CREDENTIALS_KEY); @crm/config validates these vars at boot.
 */
function billingProviderFromEnv(): BillingProvider {
  return createBillingProvider({
    kind: "asaas",
    apiKey: process.env.ASAAS_API_KEY ?? "",
    environment: process.env.ASAAS_ENVIRONMENT === "production" ? "production" : "sandbox",
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
  });
}

/** Requires billing:read (owner/admin — finance data). */
export async function listBillingPayments(
  db: Database,
  ctx: TenantContext,
  input?: ListBillingPaymentsInput,
): Promise<BillingPaymentRow[]> {
  assertPermission(ctx, { billing: ["read"] });
  const parsed = listBillingPaymentsInput.parse(input ?? {});
  return listBillingPaymentsForOrg(db, ctx.organizationId, parsed.limit);
}

/** Requires billing:read. Returns the org's latest subscription, if any. */
export async function getBillingSubscription(
  db: Database,
  ctx: TenantContext,
): Promise<BillingSubscriptionRow | undefined> {
  assertPermission(ctx, { billing: ["read"] });
  return findBillingSubscriptionForOrg(db, ctx.organizationId);
}

/**
 * Requires billing:read. Ensures the org has an ASAAS customer: returns the
 * existing row when present, otherwise creates the customer at the provider
 * and persists billing_customers (unique on organization_id — safe to retry).
 */
export async function ensureBillingCustomer(
  db: Database,
  ctx: TenantContext,
  input: EnsureBillingCustomerInput,
): Promise<BillingCustomerRow> {
  assertPermission(ctx, { billing: ["read"] });
  const parsed = ensureBillingCustomerInput.parse(input);
  const existing = await findBillingCustomerByOrg(db, ctx.organizationId);
  if (existing) return existing;
  if (!process.env.ASAAS_API_KEY) {
    throw new DomainError("BILLING_NOT_CONFIGURED", "ASAAS_API_KEY is not configured");
  }
  const { externalId } = await billingProviderFromEnv().createCustomer({
    name: parsed.name,
    email: parsed.email,
    document: parsed.cpfCnpj,
    externalReference: ctx.organizationId,
  });
  return insertBillingCustomer(db, ctx.organizationId, externalId);
}
