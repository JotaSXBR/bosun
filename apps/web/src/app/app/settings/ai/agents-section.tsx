"use client";

import type { AgentRow } from "@crm/core/agents";
import { Badge } from "@crm/design-system/components/badge";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import { toast } from "@crm/design-system/components/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import type { AiActionResult } from "@/server/actions/ai";
import { createAgentAction, deleteAgentAction } from "@/server/actions/ai";

import type { AgentForm } from "./agent-form-dialog";
import { AgentFormDialog, agentFormToPayload, EMPTY_AGENT_FORM } from "./agent-form-dialog";

type Run = (action: Promise<AiActionResult>, success?: string, onSuccess?: () => void) => void;

export function AgentsSection({
  agents,
  canManage,
  isOwner,
}: {
  agents: AgentRow[];
  canManage: boolean;
  /** System agents (observer) are owner-only — mirrored by agents/service.ts. */
  isOwner: boolean;
}) {
  const t = useTranslations("settings.ai.agents");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AgentForm>(EMPTY_AGENT_FORM);

  const run: Run = (action, success, onSuccess) =>
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

  const openCreate = () => {
    setForm(EMPTY_AGENT_FORM);
    setOpen(true);
  };

  const submit = () => {
    run(createAgentAction(agentFormToPayload(form)), t("created"), () => setOpen(false));
  };

  const statusLabel = (status: string) =>
    status === "active"
      ? t("statusActive")
      : status === "paused"
        ? t("statusPaused")
        : t("statusDraft");

  return (
    <Card bodyClassName="space-y-3" title={t("title")} subtitle={t("description")}>
      <>
        {agents.length === 0 ? (
          <p className="text-ink-muted text-sm" data-testid="agents-empty">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="agent-list">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{agent.name}</span>
                  <Badge tone="neutral">{statusLabel(agent.status)}</Badge>
                  {agent.specialty && <span className="text-ink-muted">{agent.specialty}</span>}
                </div>
                {canManage && (agent.kind !== "observer" || isOwner) && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link
                        href={`/app/settings/ai/agents/${agent.kind === "observer" ? "observer" : agent.id}`}
                      >
                        {t("edit")}
                      </Link>
                    </Button>
                    {agent.kind === "org" && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(t("deleteConfirm", { name: agent.name }))) {
                            run(deleteAgentAction(agent.id), t("deleted"));
                          }
                        }}
                      >
                        {t("delete")}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <Button size="sm" variant="secondary" onClick={openCreate} disabled={pending}>
            {t("new")}
          </Button>
        )}
      </>

      <AgentFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={null}
        form={form}
        setForm={setForm}
        pending={pending}
        onSubmit={submit}
      />
    </Card>
  );
}
