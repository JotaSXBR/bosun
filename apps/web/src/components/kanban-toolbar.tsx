"use client";

import type { FunnelRow } from "@crm/core/leads";
import { Button } from "@crm/design-system/components/button";
import { Select } from "@crm/design-system/components/select";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function KanbanToolbar({
  board,
  funnels,
  canManage,
  onNewFunnel,
  onNewStage,
  onDeleteFunnel,
}: {
  board: { funnel: FunnelRow };
  funnels: FunnelRow[];
  canManage: boolean;
  onNewFunnel: () => void;
  onNewStage: () => void;
  onDeleteFunnel: () => void;
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
        <>
          <Button variant="secondary" size="sm" iconLeft="plus" onClick={onNewFunnel}>
            {t("funnel")}
          </Button>
          <Button variant="secondary" size="sm" iconLeft="plus" onClick={onNewStage}>
            {t("newStage")}
          </Button>
          <Button variant="ghost" size="sm" className="text-danger" onClick={onDeleteFunnel}>
            {t("deleteFunnel")}
          </Button>
        </>
      )}
    </div>
  );
}
