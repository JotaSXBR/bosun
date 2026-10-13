"use server";

import { DomainError } from "@crm/core";
import type { UpdateUserPreferencesInput } from "@crm/core/users";
import { setUserPreferences } from "@crm/core/users";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import { getAuth } from "@/server/auth";
import { requireSession } from "@/server/tenant";

export type AccountActionResult = { ok: true } | { ok: false; error: string };

const THEME_COOKIE = "bosun-theme";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "account" });
  return fallback;
}

const profileInput = z.object({
  name: z.string().trim().min(2).max(80),
});

/** Display name via better-auth updateUser — avatar goes through /api/avatar. */
export async function updateProfileAction(input: unknown): Promise<AccountActionResult> {
  await requireSession();
  try {
    const parsed = profileInput.parse(input);
    await getAuth().api.updateUser({
      headers: await headers(),
      body: { name: parsed.name },
    });
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível salvar o perfil.") };
  }
}

/**
 * Personal preferences (theme, sendSeen, toasts). When the theme changes the
 * bosun-theme cookie is written too — the root layout reads it for SSR
 * data-theme so the right theme paints on first render.
 */
export async function updatePreferencesAction(input: unknown): Promise<AccountActionResult> {
  const session = await requireSession();
  try {
    const next = await setUserPreferences(
      getDb(),
      session.user.id,
      input as UpdateUserPreferencesInput,
    );
    (await cookies()).set(THEME_COOKIE, next.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível salvar as preferências.") };
  }
}

const passwordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

/** Password change — better-auth validates the current password server-side. */
export async function changePasswordAction(input: unknown): Promise<AccountActionResult> {
  await requireSession();
  try {
    const parsed = passwordInput.parse(input);
    await getAuth().api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
        // New password means a possible leak — drop other sessions.
        revokeOtherSessions: true,
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível alterar a senha.") };
  }
}

const sessionInput = z.object({ token: z.string().min(1) });

/** Revoke one session (sign out a device). Own sessions only — better-auth scopes by cookie. */
export async function revokeSessionAction(input: unknown): Promise<AccountActionResult> {
  await requireSession();
  try {
    const parsed = sessionInput.parse(input);
    await getAuth().api.revokeSession({
      headers: await headers(),
      body: { token: parsed.token },
    });
    revalidatePath("/app/account/security");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível encerrar a sessão.") };
  }
}
