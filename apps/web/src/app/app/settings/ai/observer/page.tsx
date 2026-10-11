import { hasPermission } from "@crm/permissions";

import { getOrgSettings, listOrgLlmCredentials } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { ObserverSection } from "../observer-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiObserverPage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const [settings, credentials] = await Promise.all([
    getOrgSettings(ctx),
    listOrgLlmCredentials(ctx),
  ]);

  return (
    <ObserverSection
      settings={settings}
      canManage={canManage}
      hasCredential={credentials.length > 0}
    />
  );
}
