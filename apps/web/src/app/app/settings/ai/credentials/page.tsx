import { hasPermission } from "@crm/permissions";

import { listOrgLlmCredentials } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { CredentialsSection } from "../credentials-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiCredentialsPage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const credentials = await listOrgLlmCredentials(ctx);

  return <CredentialsSection credentials={credentials} canManage={canManage} />;
}
