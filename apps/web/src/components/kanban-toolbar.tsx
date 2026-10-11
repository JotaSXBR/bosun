"use client";

import type { FunnelRow } from "@crm/core/leads";
import { Button } from "@crm/design-system/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@crm/design-system/components/dropdown-menu";
import { IconButton } from "@crm/design-system/components/icon-button";
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
          <Button variant="secondary" size="sm" iconLeft="plus" onClick={onNewStage}>
            {t("newStage")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton icon="ellipsis-vertical" label={t("moreActions")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onNewFunnel}>{t("createFunnel")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDeleteFunnel}>
                {t("deleteFunnel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
