import type { IconName } from "@crm/design-system/components/icon";
import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission, type PermissionCheck } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireTenantContext } from "@/server/tenant";

/** PARCIAL page: canonical address now, content arrives in a later slice. */
export async function SettingsStubPage({
  itemKey,
  icon,
  permission,
}: {
  itemKey: string;
  icon: IconName;
  permission: PermissionCheck;
}) {
  const t = await getTranslations("settings.hub.items");
  const ts = await getTranslations("settings");
  const ctx = await requireTenantContext();
  if (!hasPermission(ctx.role, permission)) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t(itemKey)}
        back={{ href: "/app/settings", label: ts("back") }}
        linkComponent={Link}
      />
      <EmptyState icon={icon} title={ts("stub.title")} body={ts("stub.body")} />
    </main>
  );
}
