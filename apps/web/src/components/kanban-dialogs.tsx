"use client";

import type { DealCardRow, LabelRow, StageRow } from "@crm/core/leads";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { DealFormDialog } from "@/components/deal-dialogs";
import { DeleteDealDialog } from "@/components/delete-deal-dialog";
import {
  DeleteFunnelDialog,
  DeleteStageDialog,
  NewFunnelDialog,
  StageDialog,
} from "@/components/funnel-dialogs";
import { LabelPicker } from "@/components/label-picker";
import { setDealLabelsAction } from "@/server/actions/leads";

function DealLabelsDialog({
  deal,
  labels,
  canManage,
  onClose,
}: {
  deal: DealCardRow;
  labels: LabelRow[];
  canManage: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("labelsDialogTitle", { title: deal.title })}</DialogTitle>
        </DialogHeader>
        <LabelPicker
          allLabels={labels}
          selectedIds={deal.labels.map((l) => l.id)}
          canCreate={canManage}
          triggerLabel={t("selectLabels")}
          onSave={async (labelIds) => {
            const result = await setDealLabelsAction({ dealId: deal.id, labelIds });
            if (result.ok) router.refresh();
            return result.ok
              ? { ok: true }
              : { ok: false, error: "error" in result ? result.error : undefined };
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export interface KanbanDialogState {
  funnel: boolean;
  deleteFunnel: boolean;
  stage: { open: boolean; stage?: StageRow };
  deletingStage?: StageRow;
  editingDeal?: DealCardRow;
  deletingDeal?: DealCardRow;
  labelsDeal?: DealCardRow;
  newDealStage?: string;
}

export const DIALOGS_CLOSED: KanbanDialogState = {
  funnel: false,
  deleteFunnel: false,
  stage: { open: false },
};

/** All kanban dialogs, driven by one state object in the board. */
export function KanbanDialogs({
  state,
  setState,
  funnelId,
  funnelName,
  stages,
  labels,
  canManage,
}: {
  state: KanbanDialogState;
  setState: (patch: Partial<KanbanDialogState>) => void;
  funnelId: string;
  funnelName: string;
  stages: StageRow[];
  labels: LabelRow[];
  canManage: boolean;
}) {
  const dealDialogOpen = Boolean(state.newDealStage ?? state.editingDeal);
  return (
    <>
      <NewFunnelDialog open={state.funnel} onOpenChange={(open) => setState({ funnel: open })} />
      <StageDialog
        funnelId={funnelId}
        stage={state.stage.stage}
        open={state.stage.open}
        onOpenChange={(open) => setState({ stage: { open } })}
      />
      <DeleteFunnelDialog
        funnelId={funnelId}
        funnelName={funnelName}
        open={state.deleteFunnel}
        onOpenChange={(open) => setState({ deleteFunnel: open })}
      />
      {state.deletingStage && (
        <DeleteStageDialog
          stage={state.deletingStage}
          open
          onOpenChange={(open) => !open && setState({ deletingStage: undefined })}
        />
      )}
      <DealFormDialog
        funnelId={funnelId}
        stages={stages}
        defaultStageId={state.newDealStage}
        deal={state.editingDeal}
        open={dealDialogOpen}
        onOpenChange={(open) =>
          !open && setState({ newDealStage: undefined, editingDeal: undefined })
        }
      />
      {state.deletingDeal && (
        <DeleteDealDialog
          deal={state.deletingDeal}
          open
          onOpenChange={(open) => !open && setState({ deletingDeal: undefined })}
        />
      )}
      {state.labelsDeal && (
        <DealLabelsDialog
          deal={state.labelsDeal}
          labels={labels}
          canManage={canManage}
          onClose={() => setState({ labelsDeal: undefined })}
        />
      )}
    </>
  );
}
