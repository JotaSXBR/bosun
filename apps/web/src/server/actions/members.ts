"use server";

import { AuthorizationError, DomainError, NotFoundError } from "@crm/core";
import { captureException } from "@crm/observability";
import { ORG_ROLES } from "@crm/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  acceptInvitation,
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/server/members";
import { requireSession, requireTenantContext } from "@/server/tenant";

export type MembersActionResult = { ok: true; inviteUrl?: string } | { ok: false; error: string };

const MEMBERS_PATH = "/app/settings/organization/members";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  // Authorization/NotFound are DomainErrors too — check the subclasses first.
  if (error instanceof AuthorizationError) return "Sem permissão para esta ação.";
  if (error instanceof NotFoundError) return "Registro não encontrado.";
  if (error instanceof DomainError) return error.message;
  captureException(error, { action: "members" });
  return fallback;
}

const inviteInput = z.object({
  email: z.email(),
  role: z.enum(ORG_ROLES),
  teamId: z.uuid().nullish(),
});

/**
 * Create an invitation (invitation:create). The copyable accept link is
 * always returned — e-mail sending is best-effort inside better-auth.
 */
export async function inviteMemberAction(input: unknown): Promise<MembersActionResult> {
  const ctx = await requireTenantContext();
  try {
    const inviteUrl = await inviteMember(ctx, inviteInput.parse(input));
    revalidatePath(MEMBERS_PATH);
    return { ok: true, inviteUrl };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar o convite.") };
  }
}

const idInput = z.object({ invitationId: z.string().min(1) });

/** Cancel a pending invitation (invitation:cancel — owner/admin). */
export async function cancelInvitationAction(input: unknown): Promise<MembersActionResult> {
  const ctx = await requireTenantContext();
  try {
    await cancelInvitation(ctx, idInput.parse(input).invitationId);
    revalidatePath(MEMBERS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível cancelar o convite.") };
  }
}

const roleInput = z.object({ memberId: z.string().min(1), role: z.enum(ORG_ROLES) });

/** Change a member's role (member:update) — capped by actor rank, owner-safe. */
export async function updateMemberRoleAction(input: unknown): Promise<MembersActionResult> {
  const ctx = await requireTenantContext();
  try {
    await changeMemberRole(ctx, roleInput.parse(input));
    revalidatePath(MEMBERS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível alterar o papel.") };
  }
}

const removeInput = z.object({ memberId: z.string().min(1) });

/** Remove a member (member:delete) — owner rows protected, self-target denied. */
export async function removeMemberAction(input: unknown): Promise<MembersActionResult> {
  const ctx = await requireTenantContext();
  try {
    await removeMember(ctx, removeInput.parse(input).memberId);
    revalidatePath(MEMBERS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível remover o membro.") };
  }
}

/**
 * Accept a pending invitation — the session user must own the invited email.
 * After better-auth creates the membership we attach the baked-in team and
 * switch the active org so the invitee lands inside the tenant.
 */
export async function acceptInvitationAction(input: unknown): Promise<MembersActionResult> {
  const session = await requireSession();
  try {
    await acceptInvitation(session.user, idInput.parse(input).invitationId);
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível aceitar o convite.") };
  }
}
