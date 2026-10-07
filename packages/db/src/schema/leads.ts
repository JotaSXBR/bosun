import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations } from "./auth";
import { contacts, conversations } from "./messaging";

/**
 * A sales pipeline owned by an organization. `template_ref` records which
 * niche template the stages were seeded from (FUNNEL_TEMPLATES in
 * @crm/core/leads); stages are fully editable afterwards.
 */
export const funnels = pgTable(
  "funnels",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    templateRef: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("funnels_org_idx").on(t.organizationId),
    pgPolicy("funnels_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * One column of a funnel's kanban board. `position` is the stage order
 * (unique per funnel); `color` is a key from the fixed palette, not raw hex.
 */
export const funnelStages = pgTable(
  "funnel_stages",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    funnelId: uuid()
      .notNull()
      .references(() => funnels.id, { onDelete: "cascade" }),
    name: text().notNull(),
    position: integer().notNull(),
    color: text().notNull().default("gray"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("funnel_stages_funnel_position_idx").on(t.funnelId, t.position),
    index("funnel_stages_funnel_idx").on(t.funnelId),
    index("funnel_stages_org_idx").on(t.organizationId),
    pgPolicy("funnel_stages_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * A kanban card: belongs to a CONTACT (one contact → N deals) and may link
 * at most one conversation (partial unique) — converting a conversation is
 * a human decision, never automatic. `position` orders cards inside a
 * stage; `custom_attributes` is the org-defined field bag.
 */
export const deals = pgTable(
  "deals",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    funnelId: uuid()
      .notNull()
      .references(() => funnels.id, { onDelete: "cascade" }),
    stageId: uuid()
      .notNull()
      .references(() => funnelStages.id, { onDelete: "cascade" }),
    contactId: uuid()
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    conversationId: uuid().references(() => conversations.id, {
      onDelete: "set null",
    }),
    title: text().notNull(),
    valueCents: bigint({ mode: "number" }).notNull().default(0),
    position: integer().notNull(),
    customAttributes: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("deals_conversation_unique")
      .on(t.organizationId, t.conversationId)
      .where(sql`${t.conversationId} is not null`),
    index("deals_org_stage_position_idx").on(t.organizationId, t.funnelId, t.stageId, t.position),
    index("deals_org_contact_idx").on(t.organizationId, t.contactId),
    pgPolicy("deals_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * Org-scoped tag applicable to deals and conversations. `color` is a key
 * from the fixed palette (same as stages).
 */
export const labels = pgTable(
  "labels",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text().notNull().default("gray"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("labels_org_name_idx").on(t.organizationId, t.name),
    index("labels_org_idx").on(t.organizationId),
    pgPolicy("labels_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/** Deal ↔ label join. `organization_id` denormalized for uniform RLS. */
export const dealLabels = pgTable(
  "deal_labels",
  {
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: uuid()
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    labelId: uuid()
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.dealId, t.labelId] }),
    index("deal_labels_org_idx").on(t.organizationId),
    index("deal_labels_label_idx").on(t.labelId),
    pgPolicy("deal_labels_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/** Conversation ↔ label join. `organization_id` denormalized for uniform RLS. */
export const conversationLabels = pgTable(
  "conversation_labels",
  {
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    labelId: uuid()
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.labelId] }),
    index("conversation_labels_org_idx").on(t.organizationId),
    index("conversation_labels_label_idx").on(t.labelId),
    pgPolicy("conversation_labels_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
