import { sql } from "drizzle-orm";
import {
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations, users } from "./auth";

/**
 * A sector of the organization (Vendas, Suporte...). Conversations are routed
 * to a team via `conversations.sector_id`; assignment to agents stays manual.
 */
export const teams = pgTable(
  "teams",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("teams_org_name_idx").on(t.organizationId, t.name),
    index("teams_org_idx").on(t.organizationId),
    pgPolicy("teams_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * Membership of a user in a team. `organization_id` is denormalized from the
 * parent team so the standard tenant predicate applies unchanged.
 */
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("team_members_team_user_idx").on(t.teamId, t.userId),
    index("team_members_org_idx").on(t.organizationId),
    index("team_members_user_idx").on(t.userId),
    pgPolicy("team_members_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
