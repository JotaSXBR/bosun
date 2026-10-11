import { hasPermission } from "@crm/permissions";

import { listOrgBrainEntries, listOrgStaleBrainEntries, listSectors } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { BrainSection } from "../brain-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiBrainPage() {
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const [brain, stale, sectors] = await Promise.all([
    listOrgBrainEntries(ctx),
    listOrgStaleBrainEntries(ctx),
    listSectors(ctx),
  ]);

  return (
    <BrainSection
      entries={brain}
      stale={stale}
      teams={sectors.map((s) => ({ id: s.id, name: s.name }))}
      canManage={canManage}
    />
  );
}
