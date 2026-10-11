import { sql } from "drizzle-orm";
import { jsonb, pgPolicy, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations } from "./auth";

/**
 * Activation checklist progress (1:1 with the organization). `steps` is a
 * `{ stepId: completedAtISO }` map written by `@crm/core/onboarding` — the
 * step catalogue lives there, so adding a step never needs a migration.
 * Row is created on demand (get-or-create).
 */
export const onboardingChecklist = pgTable(
  "onboarding_checklist",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    steps: jsonb().$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("onboarding_checklist_org_idx").on(t.organizationId),
    pgPolicy("onboarding_checklist_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
