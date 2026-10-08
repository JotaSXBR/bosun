import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { index, jsonb, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations, users } from "./auth";
import { contacts } from "./messaging";
import { teams } from "./teams";

/**
 * Second brain — operational memory entries an org's observer/copilot
 * learn from resolved conversations. Only rows in `status = 'canon'` are
 * trusted knowledge; staging lives as pending `agent_suggestions` with
 * `target_type = 'memory'` and promotes into this table on approval.
 * `scope` controls who may consume the entry (whole org, one team, or
 * conversations with one contact — contact-scoped entries link the row
 * but never carry PII in `content`). `superseded_by` keeps a temporal
 * chain instead of destructive updates.
 */
export const memoryEntries = pgTable(
  "memory_entries",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text().notNull(),
    scope: text().notNull().default("org"),
    teamId: uuid().references((): AnyPgColumn => teams.id, { onDelete: "set null" }),
    contactId: uuid().references((): AnyPgColumn => contacts.id, {
      onDelete: "set null",
    }),
    content: text().notNull(),
    confidence: text().notNull().default("medium"),
    sources: jsonb().notNull().default({}),
    status: text().notNull().default("canon"),
    supersededBy: uuid().references((): AnyPgColumn => memoryEntries.id, {
      onDelete: "set null",
    }),
    staleAfter: timestamp({ withTimezone: true }).notNull(),
    verifiedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("memory_entries_org_status_idx").on(t.organizationId, t.status),
    index("memory_entries_org_scope_idx").on(t.organizationId, t.scope),
    index("memory_entries_contact_idx").on(t.contactId),
    index("memory_entries_team_idx").on(t.teamId),
    pgPolicy("memory_entries_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
