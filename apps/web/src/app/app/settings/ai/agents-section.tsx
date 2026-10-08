"use client";

import type { AgentRow } from "@crm/core/agents";
import { Badge } from "@crm/ui/components/badge";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { AiActionResult } from "@/server/actions/ai";
import { createAgentAction, deleteAgentAction, updateAgentAction } from "@/server/actions/ai";

import type { AgentForm } from "./agent-form-dialog";
import {
  AgentFormDialog,
  agentFormToPayload,
  agentToForm,
  EMPTY_AGENT_FORM,
} from "./agent-form-dialog";

type Run = (action: Promise<AiActionResult>, success?: string, onSuccess?: () => void) => void;

export function AgentsSection({ agents, canManage }: { agents: AgentRow[]; canManage: boolean }) {
  const t = useTranslations("settings.ai.agents");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AgentRow | null>(null);
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
    setEditing(null);
    setForm(EMPTY_AGENT_FORM);
    setOpen(true);
  };
  const openEdit = (agent: AgentRow) => {
    setEditing(agent);
    setForm(agentToForm(agent));
    setOpen(true);
  };

  const submit = () => {
    const payload = agentFormToPayload(form);
    if (editing) {
      run(updateAgentAction({ agentId: editing.id, ...payload }), t("saved"), () => setOpen(false));
    } else {
      run(createAgentAction(payload), t("created"), () => setOpen(false));
    }
  };

  const statusLabel = (status: string) =>
    status === "active"
      ? t("statusActive")
      : status === "paused"
        ? t("statusPaused")
        : t("statusDraft");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="agents-empty">
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
                  <Badge variant="secondary">{statusLabel(agent.status)}</Badge>
                  {agent.specialty && (
                    <span className="text-muted-foreground">{agent.specialty}</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => openEdit(agent)}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(t("deleteConfirm", { name: agent.name }))) {
                          run(deleteAgentAction(agent.id), t("deleted"));
                        }
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <Button size="sm" variant="outline" onClick={openCreate} disabled={pending}>
            {t("new")}
          </Button>
        )}
      </CardContent>

      <AgentFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        pending={pending}
        onSubmit={submit}
      />
    </Card>
  );
}
