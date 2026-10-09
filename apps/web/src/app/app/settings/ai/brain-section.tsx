"use client";

import type { MemoryEntryRow } from "@crm/core/brain";
import { Badge } from "@crm/ui/components/badge";
import { Button } from "@crm/ui/components/button";
import { Card } from "@crm/ui/components/card";
import { toast } from "@crm/ui/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import type { AiActionResult } from "@/server/actions/ai";
import {
  archiveBrainEntryAction,
  proposeMemoryEntryAction,
  renewBrainEntryAction,
} from "@/server/actions/ai";

import type { ProposeForm } from "./brain-propose-dialog";
import { BrainProposeDialog, emptyProposeForm } from "./brain-propose-dialog";

const TYPE_LABEL: Record<string, string> = {
  pattern: "typePattern",
  procedure: "typeProcedure",
  faq_gap: "typeFaqGap",
  decision: "typeDecision",
  preference: "typePreference",
  escalation: "typeEscalation",
  persona: "typePersona",
  metric: "typeMetric",
};

const SCOPE_LABEL: Record<string, string> = {
  org: "scopeOrg",
  team: "scopeTeam",
  contact: "scopeContact",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function BrainSection({
  entries,
  stale,
  teams,
  canManage,
}: {
  entries: MemoryEntryRow[];
  stale: MemoryEntryRow[];
  teams: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  const t = useTranslations("settings.ai.brain");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProposeForm>(emptyProposeForm);

  const run = (action: Promise<AiActionResult>, success?: string, onSuccess?: () => void) =>
    startTransition(async () => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (success) toast.success(success);
      onSuccess?.();
      router.refresh();
    });

  const submit = () =>
    run(
      proposeMemoryEntryAction({
        type: form.type,
        scope: form.scope,
        teamId: form.scope === "team" ? form.teamId : null,
        contactId: form.scope === "contact" ? form.contactId : null,
        content: form.content.trim(),
        confidence: form.confidence,
        staleAfterDays: form.staleAfterDays,
        rationale: form.rationale.trim(),
      }),
      t("proposed"),
      () => {
        setOpen(false);
        setForm(emptyProposeForm);
      },
    );

  const entryRow = (entry: MemoryEntryRow, actions: "archive" | "stale" | "none") => (
    <li key={entry.id} className="space-y-1 border-b pb-2 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="neutral">{t(TYPE_LABEL[entry.type] ?? "typePattern")}</Badge>
          <Badge tone="neutral">{t(SCOPE_LABEL[entry.scope] ?? "scopeOrg")}</Badge>
          <Badge tone="neutral">
            {t(
              `confidence${entry.confidence === "high" ? "High" : entry.confidence === "low" ? "Low" : "Medium"}`,
            )}
          </Badge>
          <span className="text-ink-muted text-xs">
            {t("validUntil", { date: formatDate(entry.staleAfter) })}
          </span>
        </div>
        {canManage && actions !== "none" && (
          <div className="flex shrink-0 items-center gap-2">
            {actions === "stale" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(
                    renewBrainEntryAction({ entryId: entry.id, staleAfterDays: 90 }),
                    t("verified"),
                  )
                }
              >
                {t("verify")}
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (window.confirm(t("archiveConfirm"))) {
                  run(archiveBrainEntryAction(entry.id), t("archived"));
                }
              }}
            >
              {t("archive")}
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm">{entry.content}</p>
    </li>
  );

  return (
    <Card bodyClassName="space-y-4" title={t("title")} subtitle={t("description")}>
      <>
        {stale.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase">{t("staleTitle")}</p>
            <p className="text-ink-muted text-xs">{t("staleDescription")}</p>
            <ul className="space-y-2" data-testid="brain-stale-list">
              {stale.map((entry) => entryRow(entry, "stale"))}
            </ul>
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-ink-muted text-sm" data-testid="brain-empty">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="brain-list">
            {entries.map((entry) => entryRow(entry, "archive"))}
          </ul>
        )}

        {canManage && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setForm(emptyProposeForm);
              setOpen(true);
            }}
            disabled={pending}
          >
            {t("new")}
          </Button>
        )}
      </>

      <BrainProposeDialog
        open={open}
        onOpenChange={setOpen}
        teams={teams}
        form={form}
        setForm={setForm}
        pending={pending}
        onSubmit={submit}
      />
    </Card>
  );
}
