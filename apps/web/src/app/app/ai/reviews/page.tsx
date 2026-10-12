import { hasPermission } from "@crm/permissions";

import { listOrgAgents, listOrgKnowledge, listOrgSuggestions } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { AnalyzeButton } from "../analyze-button";
import { SuggestionsSection } from "../suggestions-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiSuggestionsPage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  // Spec §7.4: deciding on memory proposals is owner/admin only.
  const canReviewMemory =
    canManage && (ctx.role === "owner" || ctx.role === "admin" || ctx.isPlatformAdmin);
  const [suggestions, agents, knowledge] = await Promise.all([
    listOrgSuggestions(ctx),
    listOrgAgents(ctx),
    listOrgKnowledge(ctx),
  ]);

  return (
    <>
      <div className="flex justify-end">
        <AnalyzeButton canManage={canManage} />
      </div>
      <SuggestionsSection
        suggestions={suggestions}
        agents={agents}
        knowledge={knowledge}
        canManage={canManage}
        canReviewMemory={canReviewMemory}
      />
    </>
  );
}
