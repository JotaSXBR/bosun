import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { and, asc, eq } from "drizzle-orm";

const { knowledgeEntries } = schema;

export type KnowledgeEntryRow = typeof knowledgeEntries.$inferSelect;

export async function listEntries(
  executor: DbExecutor,
  organizationId: string,
): Promise<KnowledgeEntryRow[]> {
  return executor
    .select()
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.organizationId, organizationId))
    .orderBy(asc(knowledgeEntries.title));
}

export async function findEntryById(
  executor: DbExecutor,
  organizationId: string,
  entryId: string,
): Promise<KnowledgeEntryRow | null> {
  const [row] = await executor
    .select()
    .from(knowledgeEntries)
    .where(
      and(eq(knowledgeEntries.id, entryId), eq(knowledgeEntries.organizationId, organizationId)),
    )
    .limit(1);
  return row ?? null;
}

export async function insertEntry(
  executor: DbExecutor,
  values: {
    organizationId: string;
    title: string;
    content: string;
    status: string;
    source: string;
  },
): Promise<KnowledgeEntryRow> {
  const [row] = await executor.insert(knowledgeEntries).values(values).returning();
  if (!row) throw new Error("knowledge_entries insert returned no row");
  return row;
}

export async function updateEntry(
  executor: DbExecutor,
  entryId: string,
  values: Partial<{ title: string; content: string; status: string }>,
): Promise<KnowledgeEntryRow | undefined> {
  const [row] = await executor
    .update(knowledgeEntries)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(knowledgeEntries.id, entryId))
    .returning();
  return row;
}

export async function deleteEntry(executor: DbExecutor, entryId: string): Promise<boolean> {
  const rows = await executor
    .delete(knowledgeEntries)
    .where(eq(knowledgeEntries.id, entryId))
    .returning({ id: knowledgeEntries.id });
  return rows.length > 0;
}
