import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations } from "./auth";

/**
 * Billing = the platform charging organizations for SaaS subscriptions, via a
 * single platform-level ASAAS account (credentials in env). Rows are still
 * org-owned: the tables below follow the same tenant pattern as messaging
 * (organization_id FK cascade + tenantPredicate policy + forced RLS).
 *
 * `billing_customers` is 1:1 with organizations; `external_id` is the ASAAS
 * customer id used to resolve inbound webhook payloads back to a tenant.
 */
export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    externalId: text().notNull(),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("billing_customers_org_idx").on(t.organizationId),
    uniqueIndex("billing_customers_external_id_idx").on(t.externalId),
    pgPolicy("billing_customers_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/** One subscription row per ASAAS subscription, owned by an organization. */
export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    billingCustomerId: uuid()
      .notNull()
      .references(() => billingCustomers.id, { onDelete: "cascade" }),
    externalId: text().notNull(),
    status: text().notNull().default("pending"),
    amountCents: integer().notNull(),
    cycle: text().notNull(),
    nextDueDate: date(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("billing_subscriptions_external_id_idx").on(t.externalId),
    index("billing_subscriptions_org_idx").on(t.organizationId),
    check(
      "billing_subscriptions_status_check",
      sql`${t.status} in ('pending', 'active', 'overdue', 'canceled')`,
    ),
    check("billing_subscriptions_cycle_check", sql`${t.cycle} in ('monthly', 'yearly')`),
    pgPolicy("billing_subscriptions_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * A normalized payment keyed by the ASAAS payment id — the unique index on
 * `external_id` is the upsert target for webhook replays. `billing_subscription_id`
 * is nullable: payment events can arrive before the subscription row exists.
 */
export const billingPayments = pgTable(
  "billing_payments",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    billingSubscriptionId: uuid().references(() => billingSubscriptions.id, {
      onDelete: "set null",
    }),
    externalId: text().notNull(),
    status: text().notNull().default("pending"),
    amountCents: integer().notNull(),
    dueDate: date(),
    paidAt: timestamp({ withTimezone: true }),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("billing_payments_external_id_idx").on(t.externalId),
    index("billing_payments_org_idx").on(t.organizationId),
    check(
      "billing_payments_status_check",
      sql`${t.status} in ('pending', 'confirmed', 'received', 'overdue', 'refunded', 'deleted')`,
    ),
    pgPolicy("billing_payments_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * One row per ASAAS webhook event (`event_id` is the dedup key — delivery is
 * at-least-once, inserts use ON CONFLICT DO NOTHING). `organization_id` is
 * nullable because the tenant is resolved during processing; null-org rows
 * are platform-internal and invisible to tenant contexts by the same policy.
 */
export const billingWebhookEvents = pgTable(
  "billing_webhook_events",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    eventId: text().notNull(),
    eventType: text().notNull(),
    organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
    payload: jsonb().notNull(),
    processedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("billing_webhook_events_event_id_idx").on(t.eventId),
    index("billing_webhook_events_org_idx").on(t.organizationId),
    pgPolicy("billing_webhook_events_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
