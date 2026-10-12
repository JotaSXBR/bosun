import { Card } from "@crm/design-system/components/card";
import { hasPermission } from "@crm/permissions";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getOrgSettings, listOrgAgents, listOrgLlmCredentials } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { AgentDetail } from "../../agent-detail";
import { ObserverSection } from "../../observer-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

/**
 * Agent detail — IA spec §3: Identidade · Comportamento · Modelo · Avançado.
 * `id="observer"` is the hybrid system page: org-level observer params
 * (ai:manage) plus the agent row's prompt/model (owner only).
 */
export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("settings.ai.agents");
  const ctx = await requireTenantContext();
  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const isOwner = ctx.role === "owner" || ctx.isPlatformAdmin;
  const agents = await listOrgAgents(ctx);

  if (id === "observer") {
    const [settings, credentials] = await Promise.all([
      getOrgSettings(ctx),
      listOrgLlmCredentials(ctx),
    ]);
    const agent = agents.find((a) => a.kind === "observer");
    return (
      <>
        <ObserverSection
          settings={settings}
          canManage={canManage}
          hasCredential={credentials.length > 0}
        />
        {agent ? (
          <AgentDetail agent={agent} canEdit={canManage && isOwner} />
        ) : (
          <Card bodyClassName="text-ink-muted p-6 text-sm">{t("observerMissing")}</Card>
        )}
      </>
    );
  }

  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();
  const canEdit = canManage && (agent.kind !== "observer" || isOwner);
  return <AgentDetail agent={agent} canEdit={canEdit} />;
}
