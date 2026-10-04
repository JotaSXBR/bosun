import { sql } from "drizzle-orm";
import { z } from "zod";

import type { Database, Transaction } from "./client";

const uuidSchema = z.uuid();

/**
 * Runs `fn` inside a transaction scoped to a tenant: every query sees and may
 * write only rows of `organizationId` (enforced by RLS policies on
 * `app.organization_id`). Never pass tenant ids from untrusted input without
 * authorization checks first.
 */
export async function withTenant<T>(
  db: Database,
  organizationId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const parsed = uuidSchema.safeParse(organizationId);
  if (!parsed.success) {
    throw new Error(`withTenant: invalid organization id "${organizationId}"`);
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.organization_id', ${organizationId}, true)`);
    return fn(tx);
  });
}

/**
 * Runs `fn` inside a transaction with platform scope: RLS tenant policies are
 * bypassed for crm_app. Call ONLY from code that has already verified the
 * caller is a platform admin — this helper performs no authorization itself.
 */
export async function withPlatformScope<T>(
  db: Database,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.platform_scope', 'on', true)`);
    return fn(tx);
  });
}

/**
 * Same transaction mechanism as withPlatformScope (sets app.platform_scope),
 * but the documented entry point for system paths that legitimately have no
 * tenant context yet — e.g. webhook ingestion, which authenticates by
 * unguessable webhook token + provider signature and only afterwards enters
 * withTenant(connection.organizationId) for tenant writes. Performs no
 * authorization itself; callers must authenticate the request first.
 */
export async function withServiceAccess<T>(
  db: Database,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return withPlatformScope(db, fn);
}
