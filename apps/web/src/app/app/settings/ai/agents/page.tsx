import { hasPermission } from "@crm/permissions";

import { listOrgAgents } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { AgentsSection } from "../agents-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiAgentsPage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const isOwner = ctx.role === "owner" || ctx.isPlatformAdmin;
  const agents = await listOrgAgents(ctx);

  return <AgentsSection agents={agents} canManage={canManage} isOwner={isOwner} />;
}
