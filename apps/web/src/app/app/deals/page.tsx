import { NotFoundError } from "@crm/core";
import type { FunnelRow } from "@crm/core/leads";
import { hasPermission } from "@crm/permissions";
import { PageHeader } from "@crm/ui/templates/page-header";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { KanbanBoard } from "@/components/kanban-board";
import { NewFunnelButton } from "@/components/new-funnel-button";
import { getFunnelBoard, listOrgFunnels, listOrgLabels } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function firstFunnel(funnels: FunnelRow[], requested?: string): FunnelRow | undefined {
  return funnels.find((f) => f.id === requested) ?? funnels[0];
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ funnel?: string }>;
}) {
  const t = await getTranslations("leads");
  const ctx = await requireTenantContext();
  const { funnel: requested } = await searchParams;
  const [funnels, labels] = await Promise.all([listOrgFunnels(ctx), listOrgLabels(ctx)]);
  const canWrite = hasPermission(ctx.role, { leads: ["write"] });
  const canManage = hasPermission(ctx.role, { leads: ["manage"] });

  const funnel = firstFunnel(funnels, requested);
  if (!funnel) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-8">
        <PageHeader title={t("funnel")} />
        <div
          className="rounded-lg border border-dashed p-12 text-center"
          data-testid="empty-funnel"
        >
          <p className="text-ink-muted text-sm">{t("emptyFunnel")}</p>
          {canManage && (
            <div className="mt-4">
              <NewFunnelButton />
            </div>
          )}
        </div>
      </main>
    );
  }

  let board;
  try {
    board = await getFunnelBoard(ctx, funnel.id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <main className="space-y-4 p-8">
      <PageHeader title={t("funnel")} />
      <KanbanBoard
        board={board}
        funnels={funnels}
        labels={labels}
        canWrite={canWrite}
        canManage={canManage}
      />
    </main>
  );
}
