"use client";

import type { LabelRow } from "@crm/core/leads";
import { Badge } from "@crm/ui/components/badge";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@crm/ui/components/dialog";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { cn } from "@crm/ui/lib/utils";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { LabelPicker } from "@/components/label-picker";
import { formatValueCents, paletteStyle } from "@/components/palette";
import {
  createDealFromConversationAction,
  moveDealAction,
  setConversationLabelsAction,
} from "@/server/actions/leads";
import type { ConversationDeal, FunnelWithStages } from "@/server/services";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("panel.convertTitle")}</DialogTitle>
          <DialogDescription>{t("panel.convertDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-title">{t("panel.dealTitle")}</Label>
            <Input
              id="lead-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-funnel">{t("funnel")}</Label>
              <Select value={funnelId} onValueChange={selectFunnel}>
                <SelectTrigger id="lead-funnel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((f) => (
                    <SelectItem key={f.funnel.id} value={f.funnel.id}>
                      {f.funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-stage">{t("panel.stage")}</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger id="lead-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(funnel?.stages ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
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
        </DialogFooter>
      </DialogContent>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("panel.lead")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {deal ? (
            <>
              <div>
                <p className="font-medium">{deal.title}</p>
                <p className="text-muted-foreground text-xs">
                  {deal.funnelName}
                  {deal.valueCents > 0 && ` · ${formatValueCents(deal.valueCents)}`}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-stage-select" className="text-xs">
                  {t("panel.stage")}
                </Label>
                <Select
                  value={deal.stageId}
                  onValueChange={changeStage}
                  disabled={!canWrite || pending}
                >
                  <SelectTrigger id="deal-stage-select" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(dealFunnel?.stages ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Link
                href={`/app/deals?funnel=${deal.funnelId}`}
                className="text-muted-foreground text-xs underline"
              >
                {t("panel.viewKanban")}
              </Link>
            </>
          ) : canWrite && readyFunnels.length > 0 ? (
            <>
              <p className="text-muted-foreground text-xs">{t("panel.notLead")}</p>
              <Button size="sm" onClick={() => setConvertOpen(true)} className="w-full">
                <SparklesIcon className="size-3.5" /> {t("panel.convertTitle")}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              {readyFunnels.length === 0 ? t("panel.noFunnelHint") : t("panel.noDeal")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("labels")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {conversationLabels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className={cn("text-xs", paletteStyle(label.color).chip)}
              >
                {label.name}
              </Badge>
            ))}
            {conversationLabels.length === 0 && (
              <span className="text-muted-foreground text-xs">{t("panel.noLabelsShort")}</span>
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
        </CardContent>
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
