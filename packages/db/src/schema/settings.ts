import { sql } from "drizzle-orm";
import { jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations } from "./auth";

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
