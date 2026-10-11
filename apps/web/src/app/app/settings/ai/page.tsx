import { Card } from "@crm/design-system/components/card";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getOrgSettings,
  listOrgAgents,
  listOrgBrainEntries,
  listOrgKnowledge,
  listOrgLlmCredentials,
  listOrgStaleBrainEntries,
  listOrgSuggestions,
  listSectors,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { AgentsSection } from "./agents-section";
import { AnalyzeButton } from "./analyze-button";
import { BrainSection } from "./brain-section";
import { CredentialsSection } from "./credentials-section";
import { KnowledgeSection } from "./knowledge-section";
import { ObserverSection } from "./observer-section";
import { SuggestionsSection } from "./suggestions-section";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  const t = await getTranslations("settings.ai");
  const ts = await getTranslations("settings");
  const ctx = await requireTenantContext();

  if (!hasPermission(ctx.role, { ai: ["read"] })) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-8">
        <PageHeader
          title={t("title")}
          right={
            <Link href="/app/settings" className="text-ink-muted text-sm">
              {ts("back")}
            </Link>
          }
        />
        <Card bodyClassName="text-ink-muted p-6 text-sm">{t("restricted")}</Card>
      </main>
    );
  }

  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const isOwner = ctx.role === "owner" || ctx.isPlatformAdmin;
  const [credentials, agents, knowledge, suggestions, brain, stale, sectors, settings] =
    await Promise.all([
      listOrgLlmCredentials(ctx),
      listOrgAgents(ctx),
      listOrgKnowledge(ctx),
      listOrgSuggestions(ctx),
      listOrgBrainEntries(ctx),
      listOrgStaleBrainEntries(ctx),
      listSectors(ctx),
      getOrgSettings(ctx),
    ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={
          <>
            <AnalyzeButton canManage={canManage} />
            <Link href="/app/settings" className="text-ink-muted text-sm">
              {ts("back")}
            </Link>
          </>
        }
      />

      <SuggestionsSection
        suggestions={suggestions}
        agents={agents}
        knowledge={knowledge}
        canManage={canManage}
      />
      <CredentialsSection credentials={credentials} canManage={canManage} />
      <ObserverSection
        settings={settings}
        canManage={canManage}
        hasCredential={credentials.length > 0}
      />
      <AgentsSection agents={agents} canManage={canManage} isOwner={isOwner} />
      <KnowledgeSection entries={knowledge} canManage={canManage} />
      <BrainSection
        entries={brain}
        stale={stale}
        teams={sectors.map((s) => ({ id: s.id, name: s.name }))}
        canManage={canManage}
      />
    </main>
  );
}
