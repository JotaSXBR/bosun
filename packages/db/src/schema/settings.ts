import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, platformPredicate, tenantPredicate } from "./audit";
import { organizations, users } from "./auth";

/**
 * Per-organization settings (1:1). `business_hours` holds the weekly windows
 * shape `{ windows: { mon: [{ start, end }], ... } }` interpreted in
 * `timezone`; `off_hours_message` supports the `{proximo_atendimento}`
 * placeholder. Row is created on demand by the service (get-or-create).
 */
export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    businessHours: jsonb().notNull().default({}),
    offHoursMessage: text(),
    timezone: text().notNull().default("America/Sao_Paulo"),
    locale: text().notNull().default("pt-BR"),
    // A resolved ticket stays reopenable for this many hours — after that
    // the close-resolved-tickets sweep materializes `closed`.
    ticketReopenWindowHours: integer().notNull().default(48),
    // Observer mode (docs/product/ai-agents.md): off | on_close | interval
    // | realtime (roadmap — needs the observer tool loop). `off` orgs still
    // learn nothing automatically; manual triggers stay available.
    aiObserverMode: text().notNull().default("on_close"),
    // `interval` mode scan cadence + how long the assigned human must be
    // idle (last message inbound) before a nudge card lands in the thread.
    observerIntervalMinutes: integer().notNull().default(15),
    observerIdleMinutes: integer().notNull().default(15),
    // Interval mode upgrade: scan enqueues a draft instead of a nudge.
    observerAutoDraft: boolean().notNull().default(false),
    // Last time the observer-scan sweep ran for this org (per-org cadence).
    observerLastScanAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("organization_settings_org_idx").on(t.organizationId),
    pgPolicy("organization_settings_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * Installation-level product settings (e-mail, billing, Meta, platform AI
 * keys) — one encrypted JSON blob per `key` ("email", "billing", "meta",
 * "ai"). Values are AES-256-GCM payloads from `encryptJson`
 * (CHANNEL_CREDENTIALS_KEY). No organization_id: reachable only inside
 * `withPlatformScope` transactions — tenant-scoped queries see nothing.
 */
export const platformSettings = pgTable(
  "platform_settings",
  {
    key: text().primaryKey(),
    valueEncrypted: text().notNull(),
    updatedByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("platform_settings_platform_scope", {
      for: "all",
      to: crmAppRole,
      using: platformPredicate,
      withCheck: platformPredicate,
    }),
  ],
).enableRLS();
