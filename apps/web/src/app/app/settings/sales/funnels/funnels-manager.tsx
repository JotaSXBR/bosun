"use client";

import type { FunnelRow, StageRow } from "@crm/core/leads";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@crm/design-system/components/dropdown-menu";
import { IconButton } from "@crm/design-system/components/icon-button";
import { Select } from "@crm/design-system/components/select";
import { cn } from "@crm/design-system/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  DeleteFunnelDialog,
  DeleteStageDialog,
  NewFunnelDialog,
  StageDialog,
} from "@/components/funnel-dialogs";
import { paletteStyle } from "@/components/palette";

const BASE = "/app/settings/sales/funnels";

type StageWithDeals = StageRow & { deals?: unknown[] };

interface DialogState {
  newFunnel: boolean;
  deleteFunnel: boolean;
  stage: { open: boolean; stage?: StageRow };
  deletingStage?: StageRow;
}

const CLOSED: DialogState = { newFunnel: false, deleteFunnel: false, stage: { open: false } };
type Patch = (p: Partial<DialogState>) => void;

function StageListItem({ stage, patch }: { stage: StageWithDeals; patch: Patch }) {
  const t = useTranslations("leads");
  return (
    <li className="flex items-center justify-between py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", paletteStyle(stage.color).dot)} />
        <span className="truncate text-sm font-medium">{stage.name}</span>
        <span className="text-ink-muted text-xs">{stage.deals?.length ?? 0}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            icon="ellipsis"
            className="size-6 p-0"
            label={t("stageActions", { name: stage.name })}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => patch({ stage: { open: true, stage } })}>
            {t("editStage")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => patch({ deletingStage: stage })}>
            {t("deleteStage")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function StageList({ stages, patch }: { stages: StageWithDeals[]; patch: Patch }) {
  const t = useTranslations("leads");
  return (
    <Card title={t("stages")}>
      <ul className="divide-line divide-y">
        {stages.map((stage) => (
          <StageListItem key={stage.id} stage={stage} patch={patch} />
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        iconLeft="plus"
        className="mt-3"
        onClick={() => patch({ stage: { open: true } })}
      >
        {t("newStage")}
      </Button>
    </Card>
  );
}

function ManagerDialogs({
  funnel,
  dialogs,
  patch,
}: {
  funnel: FunnelRow | null;
  dialogs: DialogState;
  patch: Patch;
}) {
  return (
    <>
      <NewFunnelDialog
        open={dialogs.newFunnel}
        onOpenChange={(open) => patch({ newFunnel: open })}
        redirectBase={BASE}
      />
      {funnel ? (
        <>
          <StageDialog
            funnelId={funnel.id}
            stage={dialogs.stage.stage}
            open={dialogs.stage.open}
            onOpenChange={(open) => patch({ stage: { open } })}
          />
          <DeleteFunnelDialog
            funnelId={funnel.id}
            funnelName={funnel.name}
            open={dialogs.deleteFunnel}
            onOpenChange={(open) => patch({ deleteFunnel: open })}
            redirectBase={BASE}
          />
        </>
      ) : null}
      {dialogs.deletingStage ? (
        <DeleteStageDialog
          stage={dialogs.deletingStage}
          open
          onOpenChange={(open) => !open && patch({ deletingStage: undefined })}
        />
      ) : null}
    </>
  );
}

export function FunnelsManager({
  funnels,
  funnel,
  stages,
}: {
  funnels: FunnelRow[];
  funnel: FunnelRow | null;
  stages: StageWithDeals[];
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [dialogs, setDialogs] = useState<DialogState>(CLOSED);
  const patch: Patch = (p) => setDialogs((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-6">
      <Card title={t("funnel")}>
        <div className="flex flex-wrap items-center gap-2">
          {funnel ? (
            <Select
              options={funnels.map((f) => ({ value: f.id, label: f.name }))}
              value={funnel.id}
              onChange={(id) => router.push(`${BASE}?funnel=${id}`)}
              className="w-56"
              aria-label={t("funnel")}
            />
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            iconLeft="plus"
            onClick={() => patch({ newFunnel: true })}
          >
            {t("createFunnel")}
          </Button>
          {funnel ? (
            <Button variant="danger" size="sm" onClick={() => patch({ deleteFunnel: true })}>
              {t("deleteFunnel")}
            </Button>
          ) : null}
        </div>
      </Card>
      {funnel ? <StageList stages={stages} patch={patch} /> : null}
      <ManagerDialogs funnel={funnel} dialogs={dialogs} patch={patch} />
    </div>
  );
}
