import { hasPermission } from "@crm/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/app" className="text-muted-foreground text-sm underline">
          {t("back")}
        </Link>
      </div>

      <SettingsForm settings={settings} canEdit={canEdit} />

      <Card>
        <CardHeader>
          <CardTitle>{t("teams")}</CardTitle>
          <CardDescription>{t("teamsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/settings/teams" className="text-sm underline">
            {t("manageTeams")}
          </Link>
        </CardContent>
      </Card>

      {platform && <PlatformSettings summaries={platform} />}
    </main>
  );
}
