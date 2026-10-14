"use client";

import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import { Dialog } from "@crm/design-system/components/dialog";
import { Input } from "@crm/design-system/components/input";
import { Label } from "@crm/design-system/components/label";
import { Select } from "@crm/design-system/components/select";
import { toast } from "@crm/design-system/components/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { formatValueCents } from "@/components/palette";
import {
  createDealFromConversationAction,
  moveDealAction,
  updateDealAction,
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

/** "1.234,56" → 123456 — pt-BR thousand groups or dot-decimal input. */
function parseValueCents(text: string): number | null {
  const parts = text.trim().split(",");
  if (parts.length > 2) return null;
  const [head = "", frac] = parts;
  // "1.234,56" or bare "1.234" — dots in \d{1,3}+\d{3}… shape are thousand
  // separators. "1234.56" (lone dot, no group shape) is a decimal mark.
  const groups = head.split(".");
  const grouped =
    groups.length > 1 &&
    /^\d{1,3}$/.test(groups[0] ?? "") &&
    groups.slice(1).every((g) => /^\d{3}$/.test(g));
  const numeric = `${grouped ? groups.join("") : head}${frac !== undefined ? `.${frac}` : ""}`;
  if (numeric === "" || Number.isNaN(Number(numeric))) return null;
  return Math.max(0, Math.round(Number(numeric) * 100));
}

/** Click-to-edit deal value — Enter/blur saves, Esc cancels. */
function DealValue({
  dealId,
  valueCents,
  canWrite,
  t,
}: {
  dealId: string;
  valueCents: number;
  canWrite: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const commit = () => {
    const cents = parseValueCents(draft);
    setEditing(false);
    if (cents === null || cents === valueCents) return;
    startTransition(async () => {
      const result = await updateDealAction({ dealId, valueCents: cents });
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  };

  if (!canWrite) {
    return <>{valueCents > 0 && ` · ${formatValueCents(valueCents)}`}</>;
  }
  if (editing) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        className="bg-page border-line w-24 rounded-xs border px-1 text-xs"
        value={draft}
        disabled={pending}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label={t("panel.editValue")}
      />
    );
  }
  return (
    <button
      type="button"
      className="underline decoration-dotted underline-offset-2"
      title={t("panel.editValue")}
      data-testid="deal-value"
      onClick={() => {
        setDraft(valueCents > 0 ? formatValueCents(valueCents).replace(/[^\d,.-]/g, "") : "");
        setEditing(true);
      }}
    >
      {" · "}
      {valueCents > 0 ? formatValueCents(valueCents) : t("panel.setValue")}
    </button>
  );
}

export function ConversationLeadPanel({
  conversationId,
  contactName,
  deal,
  funnels,
  canWrite,
}: {
  conversationId: string;
  contactName: string;
  deal: ConversationDeal;
  funnels: FunnelWithStages[];
  canWrite: boolean;
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
                <DealValue
                  dealId={deal.id}
                  valueCents={deal.valueCents}
                  canWrite={canWrite}
                  t={t}
                />
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
