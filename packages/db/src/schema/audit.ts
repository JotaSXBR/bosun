import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

/**
 * Least-privileged application role. Created by docker/postgres/init and
 * granted table privileges in the custom rls_grants migration.
 */
export const crmAppRole = pgRole("crm_app").existing();

// Tenant-scoped RLS predicate reused by every tenant-owned table:
// either the row belongs to the tenant set via withTenant(), or the
// transaction runs under platform scope (withPlatformScope()).
const tenantPredicate = sql`organization_id = nullif(current_setting('app.organization_id', true), '')::uuid OR current_setting('app.platform_scope', true) = 'on'`;

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    targetType: text(),
    targetId: text(),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_org_created_idx").on(t.organizationId, t.createdAt.desc()),
    pgPolicy("audit_logs_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
