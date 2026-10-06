"use server";

import { DomainError } from "@crm/core";
import type { CreateTeamInput, TeamMemberInput, UpdateTeamInput } from "@crm/core/teams";
import {
  addTeamMember,
  createTeam,
  removeTeam,
  removeTeamMember,
  updateTeam,
} from "@crm/core/teams";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type TeamsActionResult = { ok: true } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "teams" });
  return fallback;
}

function revalidateTeams(): void {
  revalidatePath("/app/settings/teams");
}

export async function createTeamAction(input: CreateTeamInput): Promise<TeamsActionResult> {
  const ctx = await requireTenantContext();
  try {
    await createTeam(getDb(), ctx, input);
    revalidateTeams();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar a equipe.") };
  }
}

export async function updateTeamAction(input: UpdateTeamInput): Promise<TeamsActionResult> {
  const ctx = await requireTenantContext();
  try {
    await updateTeam(getDb(), ctx, input);
    revalidateTeams();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível atualizar a equipe.") };
  }
}

export async function deleteTeamAction(teamId: string): Promise<TeamsActionResult> {
  const ctx = await requireTenantContext();
  const parsed = z.uuid().safeParse(teamId);
  if (!parsed.success) {
    return { ok: false, error: "Equipe inválida." };
  }
  try {
    await removeTeam(getDb(), ctx, parsed.data);
    revalidateTeams();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível excluir a equipe.") };
  }
}

export async function addTeamMemberAction(input: TeamMemberInput): Promise<TeamsActionResult> {
  const ctx = await requireTenantContext();
  try {
    await addTeamMember(getDb(), ctx, input);
    revalidateTeams();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível adicionar o membro.") };
  }
}

export async function removeTeamMemberAction(input: TeamMemberInput): Promise<TeamsActionResult> {
  const ctx = await requireTenantContext();
  try {
    await removeTeamMember(getDb(), ctx, input);
    revalidateTeams();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível remover o membro.") };
  }
}
