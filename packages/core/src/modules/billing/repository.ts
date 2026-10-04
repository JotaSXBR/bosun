import type { Database, DbExecutor } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { desc, eq, sql } from "drizzle-orm";

const { billingCustomers, billingPayments, billingSubscriptions, billingWebhookEvents } = schema;

export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type BillingSubscriptionRow = typeof billingSubscriptions.$inferSelect;
export type BillingPaymentRow = typeof billingPayments.$inferSelect;
export type BillingWebhookEventRow = typeof billingWebhookEvents.$inferSelect;

/**
 * Records a webhook event. `event_id` is the dedup key — replays conflict on
 * the unique index and return undefined (ON CONFLICT DO NOTHING). Runs inside
 * the caller's service-scope transaction; organization_id stays null until the
 * tenant is resolved during processing (see markWebhookEventProcessed).
 */
export async function insertWebhookEvent(
  executor: DbExecutor,
  values: { eventId: string; eventType: string; payload: unknown },
): Promise<BillingWebhookEventRow | undefined> {
  const [row] = await executor
    .insert(billingWebhookEvents)
    .values(values)
    .onConflictDoNothing({ target: billingWebhookEvents.eventId })
    .returning();
  return row;
}

/** Stamps the event as processed and records the resolved tenant (when any). */
export async function markWebhookEventProcessed(
  executor: DbExecutor,
  eventId: string,
  organizationId: string | null,
): Promise<void> {
  await executor
    .update(billingWebhookEvents)
    .set({ processedAt: new Date(), organizationId })
    .where(eq(billingWebhookEvents.eventId, eventId));
}

/** Resolves the tenant for a payload via billing_customers.external_id (ASAAS customer id). */
export async function findBillingCustomerByExternalId(
  executor: DbExecutor,
  externalId: string,
): Promise<BillingCustomerRow | undefined> {
  const [row] = await executor
    .select()
    .from(billingCustomers)
    .where(eq(billingCustomers.externalId, externalId))
    .limit(1);
  return row;
}

export async function findSubscriptionIdByExternalId(
  executor: DbExecutor,
  externalId: string,
): Promise<string | undefined> {
  const [row] = await executor
    .select({ id: billingSubscriptions.id })
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.externalId, externalId))
    .limit(1);
  return row?.id;
}

/**
 * Upserts a payment by the ASAAS payment id. On replay the latest status wins;
 * nullable fields (subscription link, dueDate, paidAt) never overwrite a
 * previously stored value with null.
 */
export async function upsertBillingPayment(
  executor: DbExecutor,
  values: {
    organizationId: string;
    billingSubscriptionId: string | null;
    externalId: string;
    status: string;
    amountCents: number;
    dueDate: string | null;
    paidAt: Date | null;
  },
): Promise<BillingPaymentRow> {
  const [row] = await executor
    .insert(billingPayments)
    .values(values)
    .onConflictDoUpdate({
      target: billingPayments.externalId,
      set: {
        billingSubscriptionId: sql`coalesce(excluded.billing_subscription_id, ${billingPayments.billingSubscriptionId})`,
        status: sql`excluded.status`,
        amountCents: sql`excluded.amount_cents`,
        dueDate: sql`coalesce(excluded.due_date, ${billingPayments.dueDate})`,
        paidAt: sql`coalesce(excluded.paid_at, ${billingPayments.paidAt})`,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("billing_payments upsert returned no row");
  return row;
}

export async function listBillingPaymentsForOrg(
  db: Database,
  organizationId: string,
  limit: number,
): Promise<BillingPaymentRow[]> {
  return withTenant(db, organizationId, async (tx) =>
    tx.select().from(billingPayments).orderBy(desc(billingPayments.createdAt)).limit(limit),
  );
}

/** The organization's most recent subscription (orgs have at most one active plan). */
export async function findBillingSubscriptionForOrg(
  db: Database,
  organizationId: string,
): Promise<BillingSubscriptionRow | undefined> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .select()
      .from(billingSubscriptions)
      .orderBy(desc(billingSubscriptions.createdAt))
      .limit(1);
    return row;
  });
}

export async function findBillingCustomerByOrg(
  db: Database,
  organizationId: string,
): Promise<BillingCustomerRow | undefined> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .select()
      .from(billingCustomers)
      .where(eq(billingCustomers.organizationId, organizationId))
      .limit(1);
    return row;
  });
}

/**
 * Inserts the org's customer row. The unique index on organization_id makes a
 * concurrent ensureBillingCustomer safe — on conflict the existing row wins.
 */
export async function insertBillingCustomer(
  db: Database,
  organizationId: string,
  externalId: string,
): Promise<BillingCustomerRow> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .insert(billingCustomers)
      .values({ organizationId, externalId })
      .onConflictDoNothing({ target: billingCustomers.organizationId })
      .returning();
    if (row) return row;
    const [existing] = await tx
      .select()
      .from(billingCustomers)
      .where(eq(billingCustomers.organizationId, organizationId))
      .limit(1);
    if (!existing) throw new Error("billing_customers insert returned no row");
    return existing;
  });
}
