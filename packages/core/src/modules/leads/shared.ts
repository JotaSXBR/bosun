import type { Database } from "@crm/db";
import { captureException } from "@crm/observability";

import type { TenantContext } from "../../tenant/context";
import { recordAuditEvent } from "../audit";

/** postgres.js unique violations surface on `cause` — check both levels. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 2 && current; depth += 1) {
    const pg = current as { code?: string; constraint_name?: string; cause?: unknown };
    if (pg.code === "23505" && pg.constraint_name === constraint) return true;
    current = pg.cause;
  }
  return false;
}

/** Audit is post-commit best-effort — a logging failure must not fail the mutation. */
export function audit(db: Database, ctx: TenantContext, action: string, dealId: string): void {
  recordAuditEvent(db, ctx, {
    action,
    targetType: "deal",
    targetId: dealId,
    metadata: { dealId },
  }).catch((error: unknown) => captureException(error, { module: "leads", action }));
}
