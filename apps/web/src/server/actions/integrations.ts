"use server";

import { DomainError } from "@crm/core";
import type { CreateChannelConnectionInput } from "@crm/core/integrations";
import {
  createChannelConnection,
  refreshConnectionStatus,
  removeChannelConnection,
} from "@crm/core/integrations";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type IntegrationActionResult = { ok: true } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "integrations" });
  return fallback;
}

export async function createChannelConnectionAction(
  input: unknown,
): Promise<IntegrationActionResult> {
  const ctx = await requireTenantContext();
  try {
    await createChannelConnection(getDb(), ctx, input as CreateChannelConnectionInput);
    revalidatePath("/app/integrations");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar a conexão.") };
  }
}

export async function refreshChannelConnectionAction(id: string): Promise<IntegrationActionResult> {
  const ctx = await requireTenantContext();
  try {
    await refreshConnectionStatus(getDb(), ctx, id);
    revalidatePath("/app/integrations");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível atualizar o status.") };
  }
}

export async function deleteChannelConnectionAction(id: string): Promise<IntegrationActionResult> {
  const ctx = await requireTenantContext();
  try {
    await removeChannelConnection(getDb(), ctx, id);
    revalidatePath("/app/integrations");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível excluir a conexão.") };
  }
}
