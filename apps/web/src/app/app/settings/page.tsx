import { hasPermission } from "@crm/permissions";
import { Card } from "@crm/ui/components/card";
import { PageHeader } from "@crm/ui/templates/page-header";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getOrgSettings, getPlatformSettings } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { PlatformSettings } from "./platform-settings";
import { SettingsForm } from "./settings-form";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const ctx = await requireTenantContext();
  const settings = await getOrgSettings(ctx);
  // Product settings live in platform_settings — platform_admin only.
  const platform = ctx.isPlatformAdmin ? await getPlatformSettings(ctx) : null;
  // organization:update is owner/admin only — managers can still reach
  // /app/settings/teams, agents and viewers read everything.
  const canEdit = hasPermission(ctx.role, { organization: ["update"] });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={
          <Link href="/app" className="text-ink-muted text-sm">
            {t("back")}
          </Link>
        }
      />

      <SettingsForm settings={settings} canEdit={canEdit} />

      <Card title={t("teams")} subtitle={t("teamsDescription")}>
        <Link href="/app/settings/teams" className="text-sm underline">
          {t("manageTeams")}
        </Link>
      </Card>

      <Card title={t("ai.card")} subtitle={t("ai.cardDescription")}>
        <Link href="/app/settings/ai" className="text-sm underline">
          {t("ai.manage")}
        </Link>
      </Card>

      {platform && <PlatformSettings summaries={platform} />}
    </main>
  );
}
