import { Card } from "@crm/design-system/components/card";
import { Icon } from "@crm/design-system/components/icon";
import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission, type OrgRole } from "@crm/permissions";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireTenantContext } from "@/server/tenant";

import { HUB_GROUPS, type HubGroup } from "./hub";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function visibleGroups(role: OrgRole): { group: HubGroup; items: HubGroup["items"] }[] {
  return HUB_GROUPS.map((group) => ({
    group,
    items: group.items.filter((item) => hasPermission(role, item.permission)),
  })).filter(({ items }) => items.length > 0);
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const ti = await getTranslations("settings.hub.items");
  const ctx = await requireTenantContext();
  const groups = visibleGroups(ctx.role);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader title={t("title")} />
      {groups.length === 0 ? (
        <EmptyState icon="settings" title={t("hub.emptyTitle")} body={t("hub.emptyBody")} />
      ) : (
        groups.map(({ group, items }) => (
          <Card key={group.key} title={t(`hub.${group.key}`)}>
            <ul className="divide-line-subtle -mx-2 divide-y">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-control-hover focus-visible:shadow-focus flex items-center gap-3 rounded-md px-2 py-3 outline-none"
                  >
                    <span className="bg-control flex size-9 items-center justify-center rounded-full">
                      <Icon name={item.icon} size={18} className="text-icon-muted" />
                    </span>
                    <span className="flex-1">
                      <span className="text-ui text-ink-strong block font-medium">
                        {ti(item.key)}
                      </span>
                      <span className="text-ink-muted text-sm">{ti(`${item.key}Desc`)}</span>
                    </span>
                    <Icon name="chevron-right" size={16} className="text-icon-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </main>
  );
}
