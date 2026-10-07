import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";

import { DomainError, NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { DealCardRow, FunnelRow, StageRow } from "./repository";
import * as repo from "./repository";
import type {
  CreateFunnelInput,
  CreateStageInput,
  MoveStageInput,
  UpdateFunnelInput,
  UpdateStageInput,
} from "./schemas";
import {
  createFunnelInput,
  createStageInput,
  moveStageInput,
  updateFunnelInput,
  updateStageInput,
} from "./schemas";
import { findTemplate } from "./templates";

export interface BoardStage extends StageRow {
  deals: DealCardRow[];
}

export interface BoardData {
  funnel: FunnelRow;
  stages: BoardStage[];
}

// ---------- funnels ----------

/** Requires leads:read (every member). */
export async function listFunnels(db: Database, ctx: TenantContext): Promise<FunnelRow[]> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => repo.listFunnels(tx, ctx.organizationId));
}

/** Requires leads:manage. `templateRef` seeds stages from FUNNEL_TEMPLATES. */
export async function createFunnel(
  db: Database,
  ctx: TenantContext,
  input: CreateFunnelInput,
): Promise<FunnelRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = createFunnelInput.parse(input);
  const template = parsed.templateRef ? findTemplate(parsed.templateRef) : undefined;
  if (parsed.templateRef && !template) {
    throw new DomainError("TEMPLATE_UNKNOWN", `Unknown funnel template "${parsed.templateRef}"`);
  }
  return withTenant(db, ctx.organizationId, async (tx) => {
    const funnel = await repo.insertFunnel(tx, {
      organizationId: ctx.organizationId,
      name: parsed.name,
      templateRef: parsed.templateRef,
    });
    for (const [position, stage] of (template?.stages ?? []).entries()) {
      await repo.insertStage(tx, {
        organizationId: ctx.organizationId,
        funnelId: funnel.id,
        name: stage.name,
        position,
        color: stage.color,
      });
    }
    return funnel;
  });
}

/** Requires leads:manage. */
export async function updateFunnel(
  db: Database,
  ctx: TenantContext,
  input: UpdateFunnelInput,
): Promise<FunnelRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = updateFunnelInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    if (parsed.name === undefined) throw new DomainError("NO_CHANGES", "Nothing to update");
    const row = await repo.updateFunnel(tx, parsed.funnelId, { name: parsed.name });
    if (!row) throw new NotFoundError("Funnel", parsed.funnelId);
    return row;
  });
}

/** Requires leads:manage. Cascades stages + deals. */
export async function deleteFunnel(db: Database, ctx: TenantContext, funnelId: string) {
  assertPermission(ctx, { leads: ["manage"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    if (!(await repo.deleteFunnel(tx, funnelId))) throw new NotFoundError("Funnel", funnelId);
  });
}

// ---------- board ----------

/** Funnel + ordered stages + deal cards. Requires leads:read. */
export async function getBoard(
  db: Database,
  ctx: TenantContext,
  funnelId: string,
): Promise<BoardData> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    const funnel = await repo.findFunnelById(tx, ctx.organizationId, funnelId);
    if (!funnel) throw new NotFoundError("Funnel", funnelId);
    const [stages, cards] = await Promise.all([
      repo.listStages(tx, ctx.organizationId, funnelId),
      repo.listBoardDeals(tx, ctx.organizationId, funnelId),
    ]);
    return {
      funnel,
      stages: stages.map((s) => ({ ...s, deals: cards.filter((c) => c.stageId === s.id) })),
    };
  });
}

// ---------- stages ----------

/** Ordered stages of a funnel. Requires leads:read. */
export async function listStages(
  db: Database,
  ctx: TenantContext,
  funnelId: string,
): Promise<StageRow[]> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    const funnel = await repo.findFunnelById(tx, ctx.organizationId, funnelId);
    if (!funnel) throw new NotFoundError("Funnel", funnelId);
    return repo.listStages(tx, ctx.organizationId, funnelId);
  });
}

/** Requires leads:manage. Appends at the end. */
export async function createStage(
  db: Database,
  ctx: TenantContext,
  input: CreateStageInput,
): Promise<StageRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = createStageInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const funnel = await repo.findFunnelById(tx, ctx.organizationId, parsed.funnelId);
    if (!funnel) throw new NotFoundError("Funnel", parsed.funnelId);
    const stages = await repo.listStages(tx, ctx.organizationId, parsed.funnelId);
    return repo.insertStage(tx, {
      organizationId: ctx.organizationId,
      funnelId: parsed.funnelId,
      name: parsed.name,
      position: stages.length,
      color: parsed.color ?? "gray",
    });
  });
}

/** Requires leads:manage. */
export async function updateStage(
  db: Database,
  ctx: TenantContext,
  input: UpdateStageInput,
): Promise<StageRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = updateStageInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const stage = await repo.findStageById(tx, ctx.organizationId, parsed.stageId);
    if (!stage) throw new NotFoundError("Stage", parsed.stageId);
    const row = await repo.updateStage(tx, parsed.stageId, {
      name: parsed.name,
      color: parsed.color,
    });
    if (!row) throw new NotFoundError("Stage", parsed.stageId);
    return row;
  });
}

/**
 * Requires leads:manage. Reorders by removing the stage and inserting it at
 * `position` (clamped), then renumbering 0..n — small data, no gaps.
 */
export async function moveStage(
  db: Database,
  ctx: TenantContext,
  input: MoveStageInput,
): Promise<void> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = moveStageInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const stage = await repo.findStageById(tx, ctx.organizationId, parsed.stageId);
    if (!stage) throw new NotFoundError("Stage", parsed.stageId);
    const stages = await repo.listStages(tx, ctx.organizationId, stage.funnelId);
    const ordered = stages.map((s) => s.id).filter((id) => id !== stage.id);
    ordered.splice(Math.min(parsed.position, ordered.length), 0, stage.id);
    // (funnel, position) is unique — renumber in two passes via temporary
    // negatives so no update collides with a row not yet moved.
    for (const [index, stageId] of ordered.entries()) {
      await repo.updateStage(tx, stageId, { position: -(index + 1) });
    }
    for (const [position, stageId] of ordered.entries()) {
      await repo.updateStage(tx, stageId, { position });
    }
  });
}

/** Requires leads:manage. Refuses while deals sit in the stage. */
export async function deleteStage(
  db: Database,
  ctx: TenantContext,
  stageId: string,
): Promise<void> {
  assertPermission(ctx, { leads: ["manage"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    const stage = await repo.findStageById(tx, ctx.organizationId, stageId);
    if (!stage) throw new NotFoundError("Stage", stageId);
    if ((await repo.countDealsInStage(tx, stageId)) > 0) {
      throw new DomainError("STAGE_NOT_EMPTY", "Move or delete the deals in this stage first");
    }
    await repo.deleteStage(tx, stageId);
    const siblings = await repo.listStages(tx, ctx.organizationId, stage.funnelId);
    for (const [position, s] of siblings.entries()) {
      if (s.position !== position) await repo.updateStage(tx, s.id, { position });
    }
  });
}
