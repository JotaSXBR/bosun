import type { Database } from "@crm/db";
import { schema, withTenant } from "@crm/db";
import { desc } from "drizzle-orm";

const { auditLogs } = schema;

export type AuditLogRow = typeof auditLogs.$inferSelect;

export async function insertAuditLog(
  db: Database,
  organizationId: string,
  values: {
    actorUserId: string;
    action: string;
    targetType?: string | undefined;
    targetId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  },
): Promise<AuditLogRow> {
  return withTenant(db, organizationId, async (tx) => {
    const [row] = await tx
      .insert(auditLogs)
      .values({
        organizationId,
        actorUserId: values.actorUserId,
        action: values.action,
        targetType: values.targetType ?? null,
        targetId: values.targetId ?? null,
        metadata: values.metadata ?? {},
      })
      .returning();
    if (!row) throw new Error("audit_logs insert returned no row");
    return row;
  });
}

export async function listAuditLogs(
  db: Database,
  organizationId: string,
  limit: number,
): Promise<AuditLogRow[]> {
  return withTenant(db, organizationId, async (tx) =>
    tx.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit),
  );
}
