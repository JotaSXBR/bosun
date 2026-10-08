import { hasPermission } from "@crm/permissions";
import { Card, CardContent } from "@crm/ui/components/card";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  listOrgAgents,
  listOrgKnowledge,
  listOrgLlmCredentials,
  listOrgSuggestions,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { AgentsSection } from "./agents-section";
import { AnalyzeButton } from "./analyze-button";
import { CredentialsSection } from "./credentials-section";
import { KnowledgeSection } from "./knowledge-section";
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <Link href="/app/settings" className="text-muted-foreground text-sm underline">
            {ts("back")}
          </Link>
        </div>
        <Card>
          <CardContent className="text-muted-foreground p-6 text-sm">{t("restricted")}</CardContent>
        </Card>
      </main>
    );
  }

  const canManage = hasPermission(ctx.role, { ai: ["manage"] });
  const [credentials, agents, knowledge, suggestions] = await Promise.all([
    listOrgLlmCredentials(ctx),
    listOrgAgents(ctx),
    listOrgKnowledge(ctx),
    listOrgSuggestions(ctx),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <AnalyzeButton canManage={canManage} />
          <Link href="/app/settings" className="text-muted-foreground text-sm underline">
            {ts("back")}
          </Link>
        </div>
      </div>

      <SuggestionsSection
        suggestions={suggestions}
        agents={agents}
        knowledge={knowledge}
        canManage={canManage}
      />
      <CredentialsSection credentials={credentials} canManage={canManage} />
      <AgentsSection agents={agents} canManage={canManage} />
      <KnowledgeSection entries={knowledge} canManage={canManage} />
    </main>
  );
}
