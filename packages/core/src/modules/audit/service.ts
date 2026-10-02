import type { Database } from "@crm/db";

import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { AuditLogRow } from "./repository";
import { insertAuditLog, listAuditLogs } from "./repository";
import type { ListAuditEventsInput, RecordAuditEventInput } from "./schemas";
import { listAuditEventsInput, recordAuditEventInput } from "./schemas";

/**
 * Records an audit event in the caller's tenant. Any authenticated org member
 * can produce audit entries (the system records on their behalf).
 */
export async function recordAuditEvent(
  db: Database,
  ctx: TenantContext,
  input: RecordAuditEventInput,
): Promise<AuditLogRow> {
  const parsed = recordAuditEventInput.parse(input);
  return insertAuditLog(db, ctx.organizationId, {
    actorUserId: ctx.userId,
    action: parsed.action,
    targetType: parsed.targetType,
    targetId: parsed.targetId,
    metadata: parsed.metadata,
  });
}

/** Requires audit:read (owner/admin/manager). */
export async function listAuditEvents(
  db: Database,
  ctx: TenantContext,
  input?: ListAuditEventsInput,
): Promise<AuditLogRow[]> {
  assertPermission(ctx, { audit: ["read"] });
  const parsed = listAuditEventsInput.parse(input ?? {});
  return listAuditLogs(db, ctx.organizationId, parsed.limit);
}
