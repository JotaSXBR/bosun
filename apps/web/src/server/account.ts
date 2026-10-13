import "server-only";

import type { InvitationForAccept } from "@crm/core/organizations";
import { getInvitationForAccept } from "@crm/core/organizations";
import type { UserPreferences } from "@crm/core/users";
import { getUserPreferences } from "@crm/core/users";
import { getDb } from "@crm/db";
import { headers } from "next/headers";

import { getAuth } from "./auth";

/**
 * Account surfaces are user-scoped (nav spec §6) — they bind the session
 * userId internally and never take an org context.
 */
export async function getMyPreferences(userId: string): Promise<UserPreferences> {
  return getUserPreferences(getDb(), userId);
}

/** Active sessions for the security page — via better-auth (needs cookies). */
export async function listMySessions() {
  return getAuth().api.listSessions({ headers: await headers() });
}

/** Public accept-invitation read — the id is the capability token. */
export async function findInvitation(invitationId: string): Promise<InvitationForAccept | null> {
  return getInvitationForAccept(getDb(), invitationId);
}
