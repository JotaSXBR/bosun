import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listMembers, listSectors } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { TeamsManager } from "./teams-manager";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function TeamsSettingsPage() {
  const t = await getTranslations("settings");
  const ctx = await requireTenantContext();
  const [teams, members] = await Promise.all([listSectors(ctx), listMembers(ctx)]);
  // teams:manage — owner/admin/manager; agents and viewers read only.
  const canManage = hasPermission(ctx.role, { teams: ["manage"] });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("teams")}
        right={
          <Link href="/app/settings" className="text-ink-muted text-sm">
            {t("back")}
          </Link>
        }
      />

      <TeamsManager teams={teams} members={members} canManage={canManage} />
    </main>
  );
}
