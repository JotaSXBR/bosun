import type { DbExecutor } from "@crm/db";
import { schema } from "@crm/db";
import { eq, sql } from "drizzle-orm";

const { onboardingChecklist } = schema;

export type OnboardingChecklistRow = typeof onboardingChecklist.$inferSelect;

export async function findChecklist(
  executor: DbExecutor,
  organizationId: string,
): Promise<OnboardingChecklistRow | null> {
  const [row] = await executor
    .select()
    .from(onboardingChecklist)
    .where(eq(onboardingChecklist.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

export async function ensureChecklist(
  executor: DbExecutor,
  organizationId: string,
): Promise<OnboardingChecklistRow> {
  await executor
    .insert(onboardingChecklist)
    .values({ organizationId })
    .onConflictDoNothing({ target: onboardingChecklist.organizationId });
  const row = await findChecklist(executor, organizationId);
  if (!row) throw new Error("onboarding_checklist ensure returned no row");
  return row;
}

/**
 * Idempotent: an already-recorded step keeps its first completion
 * timestamp. `steps || patch` merges server-side on the locked row, so
 * concurrent marks of different steps can't lose each other.
 */
export async function markStepCompleted(
  executor: DbExecutor,
  organizationId: string,
  stepId: string,
): Promise<OnboardingChecklistRow> {
  const row = await ensureChecklist(executor, organizationId);
  if (row.steps[stepId]) return row;
  const patch = JSON.stringify({ [stepId]: new Date().toISOString() });
  const [updated] = await executor
    .update(onboardingChecklist)
    .set({
      steps: sql`${onboardingChecklist.steps} || ${patch}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(onboardingChecklist.organizationId, organizationId))
    .returning();
  return updated ?? row;
}
