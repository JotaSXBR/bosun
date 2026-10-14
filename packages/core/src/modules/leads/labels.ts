import type { Database, DbExecutor } from "@crm/db";
import { withTenant } from "@crm/db";

import { DomainError, NotFoundError } from "../../errors";
import { isUniqueViolation } from "../../lib/pg-error";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { findContactById } from "../contacts";
import * as repo from "./repository";
import type { LabelRow } from "./repository-labels";
import * as labelRepo from "./repository-labels";
import type {
  CreateLabelInput,
  SetContactLabelsInput,
  SetConversationLabelsInput,
  SetDealLabelsInput,
  UpdateLabelInput,
} from "./schemas";
import {
  createLabelInput,
  setContactLabelsInput,
  setConversationLabelsInput,
  setDealLabelsInput,
  updateLabelInput,
} from "./schemas";

// ---------- labels ----------

/** Requires leads:read. */
export async function listLabels(db: Database, ctx: TenantContext): Promise<LabelRow[]> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => labelRepo.listLabels(tx, ctx.organizationId));
}

/** Requires leads:manage. Name is unique per org. */
export async function createLabel(
  db: Database,
  ctx: TenantContext,
  input: CreateLabelInput,
): Promise<LabelRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = createLabelInput.parse(input);
  try {
    return await withTenant(db, ctx.organizationId, (tx) =>
      labelRepo.insertLabel(tx, {
        organizationId: ctx.organizationId,
        name: parsed.name,
        color: parsed.color ?? "gray",
      }),
    );
  } catch (error) {
    if (isUniqueViolation(error, "labels_org_name_idx")) {
      throw new DomainError("LABEL_NAME_TAKEN", "A label with this name already exists");
    }
    throw error;
  }
}

/** Requires leads:manage. */
export async function updateLabel(
  db: Database,
  ctx: TenantContext,
  input: UpdateLabelInput,
): Promise<LabelRow> {
  assertPermission(ctx, { leads: ["manage"] });
  const parsed = updateLabelInput.parse(input);
  return withTenant(db, ctx.organizationId, async (tx) => {
    const row = await labelRepo.updateLabel(tx, parsed.labelId, {
      name: parsed.name,
      color: parsed.color,
    });
    if (!row) throw new NotFoundError("Label", parsed.labelId);
    return row;
  });
}

/** Requires leads:manage. */
export async function deleteLabel(
  db: Database,
  ctx: TenantContext,
  labelId: string,
): Promise<void> {
  assertPermission(ctx, { leads: ["manage"] });
  return withTenant(db, ctx.organizationId, async (tx) => {
    if (!(await labelRepo.deleteLabel(tx, labelId))) throw new NotFoundError("Label", labelId);
  });
}

async function assertLabelsExist(
  tx: DbExecutor,
  organizationId: string,
  labelIds: string[],
): Promise<void> {
  const found = await labelRepo.findLabelsByIds(tx, organizationId, labelIds);
  if (found.length !== new Set(labelIds).size) {
    throw new NotFoundError("Label");
  }
}

/** Requires leads:write. Replace semantics — omitted labels are removed. */
export async function setDealLabels(
  db: Database,
  ctx: TenantContext,
  input: SetDealLabelsInput,
): Promise<void> {
  assertPermission(ctx, { leads: ["write"] });
  const parsed = setDealLabelsInput.parse(input);
  await withTenant(db, ctx.organizationId, async (tx) => {
    const deal = await repo.findDealById(tx, ctx.organizationId, parsed.dealId);
    if (!deal) throw new NotFoundError("Deal", parsed.dealId);
    await assertLabelsExist(tx, ctx.organizationId, parsed.labelIds);
    await labelRepo.replaceDealLabels(tx, {
      organizationId: ctx.organizationId,
      dealId: parsed.dealId,
      labelIds: parsed.labelIds,
    });
  });
}

/** Requires leads:write. Replace semantics — omitted labels are removed. */
export async function setConversationLabels(
  db: Database,
  ctx: TenantContext,
  input: SetConversationLabelsInput,
): Promise<void> {
  assertPermission(ctx, { leads: ["write"] });
  const parsed = setConversationLabelsInput.parse(input);
  await withTenant(db, ctx.organizationId, async (tx) => {
    const conversation = await repo.findConversationContact(
      tx,
      ctx.organizationId,
      parsed.conversationId,
    );
    if (!conversation) throw new NotFoundError("Conversation", parsed.conversationId);
    await assertLabelsExist(tx, ctx.organizationId, parsed.labelIds);
    await labelRepo.replaceConversationLabels(tx, {
      organizationId: ctx.organizationId,
      conversationId: parsed.conversationId,
      labelIds: parsed.labelIds,
    });
  });
}

/** Requires leads:read. */
export async function listConversationLabels(
  db: Database,
  ctx: TenantContext,
  conversationId: string,
): Promise<LabelRow[]> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) =>
    labelRepo.listConversationLabels(tx, conversationId),
  );
}

/** Requires leads:read — the tags on the contact ficha. */
export async function listContactLabels(
  db: Database,
  ctx: TenantContext,
  contactId: string,
): Promise<LabelRow[]> {
  assertPermission(ctx, { leads: ["read"] });
  return withTenant(db, ctx.organizationId, (tx) => labelRepo.listContactLabels(tx, contactId));
}

/** Requires leads:write. Replace semantics — omitted tags are removed. */
export async function setContactLabels(
  db: Database,
  ctx: TenantContext,
  input: SetContactLabelsInput,
): Promise<void> {
  assertPermission(ctx, { leads: ["write"] });
  const parsed = setContactLabelsInput.parse(input);
  await withTenant(db, ctx.organizationId, async (tx) => {
    const contact = await findContactById(tx, parsed.contactId);
    if (!contact) throw new NotFoundError("Contact", parsed.contactId);
    await assertLabelsExist(tx, ctx.organizationId, parsed.labelIds);
    await labelRepo.replaceContactLabels(tx, {
      organizationId: ctx.organizationId,
      contactId: parsed.contactId,
      labelIds: parsed.labelIds,
    });
  });
}
