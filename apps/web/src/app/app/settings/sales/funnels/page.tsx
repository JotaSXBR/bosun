import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FunnelsManager } from "@/app/app/settings/sales/funnels/funnels-manager";
import { getFunnelBoard, listOrgFunnels } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

/** Real funnel/stage editing — moved out of the kanban board per the IA spec. */
export default async function SalesFunnelsPage({
  searchParams,
}: {
  searchParams: Promise<{ funnel?: string }>;
}) {
  const t = await getTranslations("settings");
  const ti = await getTranslations("settings.hub.items");
  const ctx = await requireTenantContext();
  if (!hasPermission(ctx.role, { leads: ["manage"] })) notFound();

  const { funnel: requested } = await searchParams;
  const funnels = await listOrgFunnels(ctx);
  const selected = funnels.find((f) => f.id === requested) ?? funnels[0] ?? null;
  const board = selected ? await getFunnelBoard(ctx, selected.id) : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={ti("funnels")}
        back={{ href: "/app/settings", label: t("back") }}
        linkComponent={Link}
      />
      <FunnelsManager
        funnels={funnels}
        funnel={board?.funnel ?? null}
        stages={board?.stages ?? []}
      />
    </main>
  );
}
