import { Card } from "@crm/design-system/components/card";
import type { IconName } from "@crm/design-system/components/icon";
import { Icon } from "@crm/design-system/components/icon";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
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

      <Card title={t("sections")}>
        <ul className="divide-line-subtle -mx-2 divide-y">
          {(
            [
              {
                href: "/app/settings/teams",
                icon: "users",
                label: t("teams"),
                description: t("teamsDescription"),
              },
              {
                href: "/app/settings/ai",
                icon: "sparkles",
                label: t("ai.card"),
                description: t("ai.cardDescription"),
              },
            ] as { href: string; icon: IconName; label: string; description: string }[]
          ).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="hover:bg-control-hover focus-visible:shadow-focus flex items-center gap-3 rounded-md px-2 py-3 outline-none"
              >
                <span className="bg-control flex size-9 items-center justify-center rounded-full">
                  <Icon name={item.icon} size={18} className="text-icon-muted" />
                </span>
                <span className="flex-1">
                  <span className="text-ui text-ink-strong block font-medium">{item.label}</span>
                  <span className="text-ink-muted text-sm">{item.description}</span>
                </span>
                <Icon name="chevron-right" size={16} className="text-icon-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {platform && <PlatformSettings summaries={platform} />}
    </main>
  );
}
