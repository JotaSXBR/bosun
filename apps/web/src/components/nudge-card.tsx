"use client";

import { Badge } from "@crm/design-system/components/badge";
import { Button } from "@crm/design-system/components/button";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import type { DraftActionResult } from "@/server/actions/drafts";
import { dismissNudgeAction, generateFromNudgeAction } from "@/server/actions/drafts";

/** Interval-scan nudge in the thread: "Gerar sugestão" enqueues the drafter, "Dispensar" dismisses. */
export function NudgeCard({
  suggestionId,
  rationale,
}: {
  suggestionId: string;
  rationale: string;
}) {
  const t = useTranslations("nudges");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<DraftActionResult>, okToast?: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (okToast) toast.success(okToast);
      router.refresh();
    });
  const generate = () => act(() => generateFromNudgeAction({ suggestionId }), t("generatingToast"));
  const dismiss = () => act(() => dismissNudgeAction({ suggestionId }));

  return (
    <div
      className="border-line bg-raised space-y-2 rounded-md border-l-4 border-dashed p-3"
      data-testid="nudge-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-muted text-xs font-medium uppercase">{t("title")}</span>
        <Badge tone="neutral">{t("badge")}</Badge>
      </div>
      <p className="text-ink-muted text-sm italic">{rationale}</p>
      <NudgeActions pending={pending} generate={generate} dismiss={dismiss} />
    </div>
  );
}

function NudgeActions({
  pending,
  generate,
  dismiss,
}: {
  pending: boolean;
  generate: () => void;
  dismiss: () => void;
}) {
  const t = useTranslations("nudges");
  return (
    <div className="flex items-center gap-2 pt-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={generate}
        data-testid="nudge-generate"
      >
        {t("generate")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={dismiss}
        data-testid="nudge-dismiss"
      >
        {t("dismiss")}
      </Button>
    </div>
  );
}
