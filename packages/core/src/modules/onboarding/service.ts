import type { Database, DbExecutor } from "@crm/db";
import { withTenant } from "@crm/db";

import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { OnboardingChecklistRow } from "./repository";
import { ensureChecklist, markStepCompleted } from "./repository";
import type { OnboardingStepId } from "./schemas";
import { onboardingStepId } from "./schemas";

/**
 * Requires messaging:read (every org member). Get-or-create semantics;
 * backfills `org_created` — the org exists, so the step is done by
 * definition (orgs created before the feature start endowed too).
 */
export async function getChecklist(
  db: Database,
  ctx: TenantContext,
): Promise<OnboardingChecklistRow> {
  assertPermission(ctx, { messaging: ["read"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    const row = await ensureChecklist(tx, ctx.organizationId);
    if (row.steps.org_created) return row;
    return markStepCompleted(tx, ctx.organizationId, "org_created");
  });
}

/**
 * Requires messaging:read — marking is a side-effect of actions that already
 * check their own permission, so every member qualifies. Idempotent.
 */
export async function completeStep(
  db: Database,
  ctx: TenantContext,
  step: OnboardingStepId,
): Promise<OnboardingChecklistRow> {
  assertPermission(ctx, { messaging: ["read"] });
  const stepId = onboardingStepId.parse(step);
  return withTenant(db, ctx.organizationId, (tx) =>
    markStepCompleted(tx, ctx.organizationId, stepId),
  );
}

/** Same mark, for callers already inside a withTenant transaction. */
export async function completeStepInTx(
  tx: DbExecutor,
  organizationId: string,
  step: OnboardingStepId,
): Promise<OnboardingChecklistRow> {
  const stepId = onboardingStepId.parse(step);
  return markStepCompleted(tx, organizationId, stepId);
}
