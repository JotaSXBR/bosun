import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, asc, eq, inArray } from "drizzle-orm";

const { conversationLabels, dealLabels, labels } = schema;

export type LabelRow = typeof labels.$inferSelect;

// ---------- labels ----------

export async function listLabels(executor: DbExecutor, organizationId: string) {
  return executor
    .select()
    .from(labels)
    .where(eq(labels.organizationId, organizationId))
    .orderBy(asc(labels.name));
}

export async function findLabelById(executor: DbExecutor, organizationId: string, labelId: string) {
  const [row] = await executor
    .select()
    .from(labels)
    .where(and(eq(labels.id, labelId), eq(labels.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export async function findLabelsByIds(
  executor: DbExecutor,
  organizationId: string,
  labelIds: string[],
) {
  if (labelIds.length === 0) return [];
  return executor
    .select()
    .from(labels)
    .where(and(eq(labels.organizationId, organizationId), inArray(labels.id, labelIds)));
}

export async function insertLabel(
  executor: DbExecutor,
  values: { organizationId: string; name: string; color: string },
) {
  const [row] = await executor.insert(labels).values(values).returning();
  if (!row) throw new Error("labels insert returned no row");
  return row;
}

export async function updateLabel(
  executor: DbExecutor,
  labelId: string,
  values: { name?: string; color?: string },
) {
  const [row] = await executor.update(labels).set(values).where(eq(labels.id, labelId)).returning();
  return row;
}

export async function deleteLabel(executor: DbExecutor, labelId: string) {
  const rows = await executor
    .delete(labels)
    .where(eq(labels.id, labelId))
    .returning({ id: labels.id });
  return rows.length > 0;
}

// ---------- label joins ----------

export async function listConversationLabels(executor: DbExecutor, conversationId: string) {
  const rows = await executor
    .select({ label: labels })
    .from(conversationLabels)
    .innerJoin(labels, eq(conversationLabels.labelId, labels.id))
    .where(eq(conversationLabels.conversationId, conversationId))
    .orderBy(asc(labels.name));
  return rows.map((r) => r.label);
}

export async function replaceDealLabels(
  executor: DbExecutor,
  values: { organizationId: string; dealId: string; labelIds: string[] },
) {
  await executor.delete(dealLabels).where(eq(dealLabels.dealId, values.dealId));
  if (values.labelIds.length === 0) return;
  await executor
    .insert(dealLabels)
    .values(
      values.labelIds.map((labelId) => ({
        organizationId: values.organizationId,
        dealId: values.dealId,
        labelId,
      })),
    )
    .onConflictDoNothing({ target: [dealLabels.dealId, dealLabels.labelId] });
}

export async function replaceConversationLabels(
  executor: DbExecutor,
  values: { organizationId: string; conversationId: string; labelIds: string[] },
) {
  await executor
    .delete(conversationLabels)
    .where(eq(conversationLabels.conversationId, values.conversationId));
  if (values.labelIds.length === 0) return;
  await executor
    .insert(conversationLabels)
    .values(
      values.labelIds.map((labelId) => ({
        organizationId: values.organizationId,
        conversationId: values.conversationId,
        labelId,
      })),
    )
    .onConflictDoNothing({
      target: [conversationLabels.conversationId, conversationLabels.labelId],
    });
}
