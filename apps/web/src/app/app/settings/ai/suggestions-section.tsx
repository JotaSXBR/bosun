"use client";

import type { AgentRow } from "@crm/core/agents";
import type { KnowledgeEntryRow } from "@crm/core/knowledge";
import type { AgentSuggestionRow } from "@crm/core/suggestions";
import { Badge } from "@crm/ui/components/badge";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { approveSuggestionAction, rejectSuggestionAction } from "@/server/actions/ai";

export function SuggestionsSection({
  suggestions,
  agents,
  knowledge,
  canManage,
}: {
  suggestions: AgentSuggestionRow[];
  agents: AgentRow[];
  knowledge: KnowledgeEntryRow[];
  canManage: boolean;
}) {
  const t = useTranslations("settings.ai.suggestions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (action: Promise<{ ok: true } | { ok: false; error: string }>, success: string) =>
    startTransition(async () => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(success);
      router.refresh();
    });

  const targetName = (s: AgentSuggestionRow): string => {
    if (s.targetType === "memory") {
      const content = (s.payload as { content?: string }).content ?? "";
      return content.length > 80 ? `${content.slice(0, 80)}…` : content;
    }
    if (!s.targetId) return t("targetNew");
    if (s.targetType === "agent") {
      return agents.find((a) => a.id === s.targetId)?.name ?? s.targetId;
    }
    return knowledge.find((k) => k.id === s.targetId)?.title ?? s.targetId;
  };

  const targetLabel = (s: AgentSuggestionRow): string =>
    s.targetType === "agent"
      ? t("targetAgent")
      : s.targetType === "memory"
        ? t("targetMemory")
        : t("targetKnowledge");

  const pendingList = suggestions.filter((s) => s.status === "pending");
  const reviewed = suggestions.filter((s) => s.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingList.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="suggestions-empty">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-3" data-testid="suggestion-list">
            {pendingList.map((s) => (
              <li key={s.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{targetLabel(s)}</Badge>
                  <span className="font-medium">{targetName(s)}</span>
                </div>
                <p className="text-sm">{s.rationale}</p>
                <details className="text-muted-foreground text-xs">
                  <summary>
                    {t("fields", { fields: Object.keys(s.payload as object).join(", ") })}
                  </summary>
                  <pre className="bg-muted mt-1 overflow-x-auto rounded p-2">
                    {JSON.stringify(s.payload, null, 2)}
                  </pre>
                </details>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => run(approveSuggestionAction(s.id), t("approved"))}
                    >
                      {t("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(rejectSuggestionAction(s.id), t("rejected"))}
                    >
                      {t("reject")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {reviewed.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-muted-foreground text-xs font-medium uppercase">{t("history")}</p>
            <ul className="space-y-1" data-testid="suggestion-history">
              {reviewed.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={s.status === "approved" ? "secondary" : "outline"}>
                    {s.status === "approved" ? t("statusApproved") : t("statusRejected")}
                  </Badge>
                  <span className="text-muted-foreground">
                    {targetLabel(s)} · {targetName(s)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
