"use client";

import type { FunnelRow } from "@crm/core/leads";
import { Button } from "@crm/design-system/components/button";
import { Select } from "@crm/design-system/components/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/** Board toolbar: funnel picker + shortcut to the settings hub (editing lives there). */
export function KanbanToolbar({
  board,
  funnels,
  canManage,
}: {
  board: { funnel: FunnelRow };
  funnels: FunnelRow[];
  canManage: boolean;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        options={funnels.map((f) => ({ value: f.id, label: f.name }))}
        value={board.funnel.id}
        onChange={(funnelId) => router.push(`/app/deals?funnel=${funnelId}`)}
        className="w-56"
        aria-label={t("funnel")}
      />
      {canManage && (
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/app/settings/sales/funnels?funnel=${board.funnel.id}`}>
            {t("editFunnel")}
          </Link>
        </Button>
      )}
    </div>
  );
}
