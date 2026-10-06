import type { Database, DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";

const { organizationMembers, organizations, organizationSettings, users } = schema;

// Better Auth tables have no RLS (auth runs before tenant context exists),
// so membership lookups are plain selects — authorization is the service's job.

export async function findMember(
  db: Database,
  userId: string,
  organizationId: string,
): Promise<{ role: string } | null> {
  const [row] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listMemberships(
  db: Database,
  userId: string,
): Promise<{ organizationId: string; organizationName: string; role: string }[]> {
  return db
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));
}

/** All org members with user identity — the transfer/assignee picker source. */
export async function listOrgMembers(
  db: Database,
  organizationId: string,
): Promise<{ userId: string; name: string; email: string; role: string }[]> {
  return db
    .select({
      userId: organizationMembers.userId,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, organizationId));
}

// organization_settings is tenant-owned (RLS) — these run inside withTenant.

export type OrganizationSettingsRow = typeof organizationSettings.$inferSelect;

export async function findSettings(
  executor: DbExecutor,
  organizationId: string,
): Promise<OrganizationSettingsRow | null> {
  const [row] = await executor
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

/** Get-or-create: concurrent first calls collapse on the org unique index. */
export async function getOrCreateSettings(
  executor: DbExecutor,
  organizationId: string,
): Promise<OrganizationSettingsRow> {
  const existing = await findSettings(executor, organizationId);
  if (existing) return existing;
  await executor
    .insert(organizationSettings)
    .values({ organizationId })
    .onConflictDoNothing({ target: organizationSettings.organizationId });
  const row = await findSettings(executor, organizationId);
  if (!row) throw new Error("organization_settings upsert returned no row");
  return row;
}

export async function upsertSettings(
  executor: DbExecutor,
  organizationId: string,
  values: {
    businessHours?: unknown;
    offHoursMessage?: string | null;
    timezone?: string;
    locale?: string;
  },
): Promise<OrganizationSettingsRow> {
  const [row] = await executor
    .insert(organizationSettings)
    .values({ organizationId, ...values })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("organization_settings upsert returned no row");
  return row;
}
