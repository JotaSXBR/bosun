"use server";

import { DomainError } from "@crm/core";
import {
  disconnectGoogle,
  saveGoogleClient,
  verifyGoogleConnection,
} from "@crm/core/external-connections";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { googleRedirectUri } from "@/app/api/integrations/google/redirect";
import { requireTenantContext } from "@/server/tenant";

const CHANNELS_PATH = "/app/settings/channels";

export type GoogleConnectResult = { ok: true; authUrl: string } | { ok: false; error: string };
export type GoogleVerifyResult =
  { ok: true; status: string; error: string | null } | { ok: false; error: string };
export type GoogleActionResult = { ok: true } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "external-connections" });
  return fallback;
}

/** Saves the org's OAuth client and returns the Google consent URL to redirect to. */
export async function connectGoogleAction(input: {
  clientId: string;
  clientSecret: string;
}): Promise<GoogleConnectResult> {
  const ctx = await requireTenantContext();
  try {
    const { authUrl } = await saveGoogleClient(getDb(), ctx, {
      ...input,
      redirectUri: googleRedirectUri(),
    });
    revalidatePath(CHANNELS_PATH);
    return { ok: true, authUrl };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível iniciar a conexão.") };
  }
}

/** Live token check — reports the resulting status instead of throwing on a dead token. */
export async function verifyGoogleAction(): Promise<GoogleVerifyResult> {
  const ctx = await requireTenantContext();
  try {
    const connection = await verifyGoogleConnection(getDb(), ctx);
    revalidatePath(CHANNELS_PATH);
    return { ok: true, status: connection.status, error: connection.lastError };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível verificar a conexão.") };
  }
}

export async function disconnectGoogleAction(): Promise<GoogleActionResult> {
  const ctx = await requireTenantContext();
  try {
    await disconnectGoogle(getDb(), ctx);
    revalidatePath(CHANNELS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível desconectar.") };
  }
}
