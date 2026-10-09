"use client";

import type { LabelRow } from "@crm/core/leads";
import { Badge } from "@crm/design-system/components/badge";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import { Dialog } from "@crm/design-system/components/dialog";
import { Input } from "@crm/design-system/components/input";
import { Label } from "@crm/design-system/components/label";
import { Select } from "@crm/design-system/components/select";
import { toast } from "@crm/design-system/components/toast";
import { cn } from "@crm/design-system/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { LabelPicker } from "@/components/label-picker";
import { formatValueCents, paletteStyle } from "@/components/palette";
import {
  createDealFromConversationAction,
  moveDealAction,
  setConversationLabelsAction,
} from "@/server/actions/leads";
import type { ConversationDeal, FunnelWithStages } from "@/server/services";

/** Radix Select rejects "" — empty form state maps to `undefined`. */
const selectedOrUndefined = (v: string) => v || undefined;

function ConvertToDealDialog({
  conversationId,
  contactName,
  funnels,
  open,
  onOpenChange,
}: {
  conversationId: string;
  contactName: string;
  funnels: FunnelWithStages[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [funnelId, setFunnelId] = useState(funnels[0]?.funnel.id ?? "");
  const funnel = funnels.find((f) => f.funnel.id === funnelId) ?? funnels[0];
  const [stageId, setStageId] = useState(funnel?.stages[0]?.id ?? "");
  const [title, setTitle] = useState(contactName);
  const [pending, startTransition] = useTransition();

  function selectFunnel(next: string) {
    setFunnelId(next);
    const f = funnels.find((x) => x.funnel.id === next);
    setStageId(f?.stages[0]?.id ?? "");
  }

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("panel.convertTitle")}
      description={t("panel.convertDescription")}
      footer={
        <Button
          variant="primary"
          disabled={!title.trim() || !stageId || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await createDealFromConversationAction({
                conversationId,
                funnelId,
                stageId,
                title: title.trim(),
              });
              if (result.ok) {
                toast.success(t("panel.converted"));
                onOpenChange(false);
                router.refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          {t("dealForm.createSubmit")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-title">{t("panel.dealTitle")}</Label>
          <Input
            shape="rounded"
            id="lead-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-funnel">{t("funnel")}</Label>
            <Select
              options={funnels.map((f) => ({ value: f.funnel.id, label: f.funnel.name }))}
              value={selectedOrUndefined(funnelId)}
              onChange={selectFunnel}
              id="lead-funnel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-stage">{t("panel.stage")}</Label>
            <Select
              options={(funnel?.stages ?? []).map((s) => ({ value: s.id, label: s.name }))}
              value={selectedOrUndefined(stageId)}
              onChange={setStageId}
              id="lead-stage"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function ConversationLeadPanel({
  conversationId,
  contactName,
  deal,
  funnels,
  allLabels,
  conversationLabels,
  canWrite,
  canManage,
}: {
  conversationId: string;
  contactName: string;
  deal: ConversationDeal;
  funnels: FunnelWithStages[];
  allLabels: LabelRow[];
  conversationLabels: LabelRow[];
  canWrite: boolean;
  canManage: boolean;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [convertOpen, setConvertOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const dealFunnel = deal ? funnels.find((f) => f.funnel.id === deal.funnelId) : undefined;
  const readyFunnels = funnels.filter((f) => f.stages.length > 0);

  function changeStage(nextStageId: string) {
    if (!deal) return;
    startTransition(async () => {
      // position clamps to the end of the target stage.
      const result = await moveDealAction({
        dealId: deal.id,
        stageId: nextStageId,
        position: 9999,
      });
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-72" data-testid="lead-panel">
      <Card bodyClassName="space-y-3 text-sm" title={t("panel.lead")}>
        {deal ? (
          <>
            <div>
              <p className="font-medium">{deal.title}</p>
              <p className="text-ink-muted text-xs">
                {deal.funnelName}
                {deal.valueCents > 0 && ` · ${formatValueCents(deal.valueCents)}`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-stage-select" className="text-xs">
                {t("panel.stage")}
              </Label>
              <Select
                options={(dealFunnel?.stages ?? []).map((s) => ({ value: s.id, label: s.name }))}
                value={deal.stageId}
                onChange={changeStage}
                disabled={!canWrite || pending}
                size="sm"
                id="deal-stage-select"
              />
            </div>
            <Link
              href={`/app/deals?funnel=${deal.funnelId}`}
              className="text-ink-muted text-xs underline"
            >
              {t("panel.viewKanban")}
            </Link>
          </>
        ) : canWrite && readyFunnels.length > 0 ? (
          <>
            <p className="text-ink-muted text-xs">{t("panel.notLead")}</p>
            <Button
              variant="primary"
              size="sm"
              iconLeft="sparkles"
              onClick={() => setConvertOpen(true)}
              className="w-full"
            >
              {t("panel.convertTitle")}
            </Button>
          </>
        ) : (
          <p className="text-ink-muted text-xs">
            {readyFunnels.length === 0 ? t("panel.noFunnelHint") : t("panel.noDeal")}
          </p>
        )}
      </Card>

      <Card bodyClassName="space-y-2" title={t("labels")}>
        <div className="flex flex-wrap gap-1">
          {conversationLabels.map((label) => (
            <Badge
              key={label.id}
              tone="neutral"
              className={cn("text-xs", paletteStyle(label.color).chip)}
            >
              {label.name}
            </Badge>
          ))}
          {conversationLabels.length === 0 && (
            <span className="text-ink-muted text-xs">{t("panel.noLabelsShort")}</span>
          )}
        </div>
        {canWrite && (
          <LabelPicker
            allLabels={allLabels}
            selectedIds={conversationLabels.map((l) => l.id)}
            canCreate={canManage}
            onSave={async (labelIds) => {
              const result = await setConversationLabelsAction({ conversationId, labelIds });
              if (result.ok) router.refresh();
              return result.ok
                ? { ok: true }
                : { ok: false, error: "error" in result ? result.error : undefined };
            }}
          />
        )}
      </Card>

      <ConvertToDealDialog
        conversationId={conversationId}
        contactName={contactName}
        funnels={readyFunnels}
        open={convertOpen}
        onOpenChange={setConvertOpen}
      />
    </aside>
  );
}
