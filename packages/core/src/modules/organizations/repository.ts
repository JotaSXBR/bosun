import type { Database, DbExecutor } from "@crm/db";
import { schema, sql } from "@crm/db";
import { and, eq } from "drizzle-orm";

const {
  organizationInvitations,
  organizationMembers,
  organizations,
  organizationSettings,
  teams,
  users,
} = schema;

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
): Promise<{ memberId: string; userId: string; name: string; email: string; role: string }[]> {
  return db
    .select({
      memberId: organizationMembers.id,
      userId: organizationMembers.userId,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, organizationId));
}

export type PendingInvitationRow = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date | null;
  createdAt: Date;
  inviterName: string;
  teamId: string | null;
  teamName: string | null;
};

/** Pending invitations with inviter and team names — the members page list.
 *  Joins teams (RLS) — call inside withTenant. */
export async function listPendingInvitations(
  executor: DbExecutor,
  organizationId: string,
): Promise<PendingInvitationRow[]> {
  return executor
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      role: organizationInvitations.role,
      expiresAt: organizationInvitations.expiresAt,
      createdAt: organizationInvitations.createdAt,
      inviterName: users.name,
      teamId: organizationInvitations.teamId,
      teamName: teams.name,
    })
    .from(organizationInvitations)
    .innerJoin(users, eq(users.id, organizationInvitations.inviterId))
    .leftJoin(teams, eq(teams.id, organizationInvitations.teamId))
    .where(
      and(
        eq(organizationInvitations.organizationId, organizationId),
        eq(organizationInvitations.status, "pending"),
      ),
    );
}

/**
 * Sets the team on a pending invitation, scoped by org — returns false when
 * the invitation doesn't exist in this organization.
 */
export async function updateInvitationTeam(
  db: Database,
  organizationId: string,
  invitationId: string,
  teamId: string | null,
): Promise<boolean> {
  const rows = await db
    .update(organizationInvitations)
    .set({ teamId })
    .where(
      and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, organizationId),
      ),
    )
    .returning({ id: organizationInvitations.id });
  return rows.length > 0;
}

export type InvitationForAccept = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | null;
  organizationId: string;
  organizationName: string;
  teamId: string | null;
};

/**
 * Public accept-page lookup — the invitation id is the capability token, so
 * this runs without tenant context (pre-auth route).
 */
export async function findInvitation(
  db: Database,
  invitationId: string,
): Promise<InvitationForAccept | null> {
  const [row] = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      role: organizationInvitations.role,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
      organizationId: organizationInvitations.organizationId,
      organizationName: organizations.name,
      teamId: organizationInvitations.teamId,
    })
    .from(organizationInvitations)
    .innerJoin(organizations, eq(organizations.id, organizationInvitations.organizationId))
    .where(eq(organizationInvitations.id, invitationId))
    .limit(1);
  return row ?? null;
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
    ticketReopenWindowHours?: number;
    aiObserverMode?: string;
    observerIntervalMinutes?: number;
    observerIdleMinutes?: number;
    observerAutoDraft?: boolean;
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

export type ObserverScanOrg = {
  organizationId: string;
  intervalMinutes: number;
  idleMinutes: number;
  autoDraft: boolean;
};

/**
 * Observer-scan due list (cron every 5 min): orgs in `interval` mode whose
 * per-org cadence elapsed since the last scan. Cross-tenant by design —
 * call inside withServiceAccess; interval mode requires an explicit
 * settings row, so orgs that never opted in never appear.
 */
export async function listObserverScanDue(executor: DbExecutor): Promise<ObserverScanOrg[]> {
  return executor
    .select({
      organizationId: organizationSettings.organizationId,
      intervalMinutes: organizationSettings.observerIntervalMinutes,
      idleMinutes: organizationSettings.observerIdleMinutes,
      autoDraft: organizationSettings.observerAutoDraft,
    })
    .from(organizationSettings)
    .where(
      and(
        eq(organizationSettings.aiObserverMode, "interval"),
        sql`${organizationSettings.observerLastScanAt} is null or ${organizationSettings.observerLastScanAt} < now() - make_interval(mins => ${organizationSettings.observerIntervalMinutes})`,
      ),
    );
}

/** Stamps the scan watermark — a failed org still advances its own cadence. */
export async function markObserverScanAt(
  executor: DbExecutor,
  organizationId: string,
): Promise<void> {
  await executor
    .update(organizationSettings)
    .set({ observerLastScanAt: new Date() })
    .where(eq(organizationSettings.organizationId, organizationId));
}
