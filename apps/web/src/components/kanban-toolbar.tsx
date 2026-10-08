"use client";

import type { FunnelRow } from "@crm/core/leads";
import { Button } from "@crm/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { PlusIcon } from "lucide-react";
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
        value={board.funnel.id}
        onValueChange={(funnelId) => router.push(`/app/deals?funnel=${funnelId}`)}
      >
        <SelectTrigger className="w-56" aria-label={t("funnel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {funnels.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canManage && (
        <>
          <Button variant="outline" size="sm" onClick={onNewFunnel}>
            <PlusIcon className="size-3.5" /> {t("funnel")}
          </Button>
          <Button variant="outline" size="sm" onClick={onNewStage}>
            <PlusIcon className="size-3.5" /> {t("newStage")}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDeleteFunnel}>
            {t("deleteFunnel")}
          </Button>
        </>
      )}
    </div>
  );
}
