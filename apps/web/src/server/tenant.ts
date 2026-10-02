import "server-only";

import type { Session } from "@crm/auth";
import { getAuth } from "@crm/auth";
import type { TenantContext } from "@crm/core";
import { getMembership, listUserOrganizations } from "@crm/core/organizations";
import { getDb } from "@crm/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession(): Promise<Session | null> {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
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

  const membership = await getMembership(db, {
    userId: session.user.id,
    organizationId,
  });
  if (!membership) redirect("/onboarding");

  return {
    organizationId,
    userId: session.user.id,
    role: membership.role,
    isPlatformAdmin: session.user.role === "platform_admin",
  };
}
