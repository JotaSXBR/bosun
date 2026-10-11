import { hasPermission } from "@crm/permissions";

import { listOrgKnowledge } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { KnowledgeSection } from "../knowledge-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiKnowledgePage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const knowledge = await listOrgKnowledge(ctx);

  return <KnowledgeSection entries={knowledge} canManage={canManage} />;
}
