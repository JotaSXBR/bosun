import "server-only";

import type { Session } from "@crm/auth";
import type { TenantContext } from "@crm/core";
import { getMembership, listUserOrganizations } from "@crm/core/organizations";
import { isProductConfigured } from "@crm/core/platform";
import { getDb } from "@crm/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "./auth";

export async function getSession(): Promise<Session | null> {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

async function resolveTenantContext(
  session: Session,
  organizationId: string,
): Promise<TenantContext | null> {
  const membership = await getMembership(getDb(), {
    userId: session.user.id,
    organizationId,
  });
  if (!membership) return null;
  return {
    organizationId,
    userId: session.user.id,
    role: membership.role,
    isPlatformAdmin: session.user.role === "platform_admin",
  };
}

/**
 * Builds the TenantContext for the current request. Redirects to /sign-in
 * when unauthenticated and to /onboarding when the user has no organization.
 * If the session has no active organization but the user belongs to one,
 * the first membership is activated.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await requireSession();
  const db = getDb();

  let organizationId = session.session.activeOrganizationId ?? null;
  if (!organizationId) {
    const memberships = await listUserOrganizations(db, session.user.id);
    const first = memberships[0];
    if (!first) redirect("/onboarding");
    await getAuth().api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: first.organizationId },
    });
    organizationId = first.organizationId;
  }

  const ctx = await resolveTenantContext(session, organizationId);
  if (!ctx) redirect("/onboarding");
  // First-run gate: a platform admin without product e-mail configured is
  // sent to the setup wizard. /app/setup uses requireSession (never this
  // helper) so the gate can't loop.
  if (ctx.isPlatformAdmin && !(await isProductConfigured(db, "email"))) {
    redirect("/app/setup");
  }
  return ctx;
}

/**
 * Same TenantContext derivation as requireTenantContext but returns null
 * instead of redirecting — for route handlers that must answer 401 rather
 * than send the client to /sign-in or /onboarding. The active organization
 * still comes from the Better Auth session, never from request input.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getSession();
  if (!session) return null;

  const organizationId =
    session.session.activeOrganizationId ??
    (await listUserOrganizations(getDb(), session.user.id))[0]?.organizationId;
  if (!organizationId) return null;

  return resolveTenantContext(session, organizationId);
}
