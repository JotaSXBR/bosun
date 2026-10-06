"use server";

import { DomainError } from "@crm/core";
import type { UpdateOrgSettingsInput } from "@crm/core/organizations";
import { updateOrganizationSettings } from "@crm/core/organizations";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "settings" });
  return fallback;
}

export async function updateOrgSettingsAction(
  input: UpdateOrgSettingsInput,
): Promise<SettingsActionResult> {
  const ctx = await requireTenantContext();
  try {
    await updateOrganizationSettings(getDb(), ctx, input);
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível salvar as configurações.") };
  }
}
