"use client";

import type { AgentRow } from "@crm/core/agents";
import { Badge } from "@crm/design-system/components/badge";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { deleteAgentAction, updateAgentAction } from "@/server/actions/ai";

import {
  AgentAdvancedFields,
  AgentBehaviorFields,
  AgentIdentityFields,
  AgentModelFields,
} from "./agent-fields";
import type { AgentForm } from "./agent-form-dialog";
import { agentFormToPayload, agentToForm } from "./agent-form-dialog";

/** Agent detail in the spec's four sections — save edits via the shared payload mapper. */
export function AgentDetail({
  agent,
  canEdit,
}: {
  agent: AgentRow;
  /** ai:manage + role editable (system kinds are owner-only); false → read-only. */
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<AgentForm>(() => agentToForm(agent));
  const disabled = pending || !canEdit;
  const isSystem = agent.kind !== "org";

  return (
    <Card bodyClassName="space-y-5">
      <AgentDetailHeader agent={agent} isSystem={isSystem} />
      <AgentDetailSections form={form} setForm={setForm} pending={disabled} />
      {canEdit && (
        <AgentDetailActions
          agent={agent}
          form={form}
          isSystem={isSystem}
          pending={pending}
          startTransition={startTransition}
        />
      )}
    </Card>
  );
}

function AgentDetailHeader({ agent, isSystem }: { agent: AgentRow; isSystem: boolean }) {
  const t = useTranslations("settings.ai.agents");
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-medium">{agent.name}</h2>
      <Badge tone="neutral">
        {agent.status === "active"
          ? t("statusActive")
          : agent.status === "paused"
            ? t("statusPaused")
            : t("statusDraft")}
      </Badge>
      {isSystem && <Badge tone="neutral">{t("systemBadge")}</Badge>}
    </div>
  );
}

function AgentDetailSections({
  form,
  setForm,
  pending,
}: {
  form: AgentForm;
  setForm: (form: AgentForm) => void;
  pending: boolean;
}) {
  const t = useTranslations("settings.ai.agents");
  const sections = [
    {
      key: "identity",
      node: <AgentIdentityFields form={form} setForm={setForm} pending={pending} />,
    },
    { key: "model", node: <AgentModelFields form={form} setForm={setForm} pending={pending} /> },
    {
      key: "behavior",
      node: <AgentBehaviorFields form={form} setForm={setForm} pending={pending} />,
    },
    {
      key: "advanced",
      node: <AgentAdvancedFields form={form} setForm={setForm} pending={pending} />,
    },
  ];
  return (
    <>
      {sections.map((s) => (
        <section key={s.key} className="space-y-3">
          <h3 className="text-ink-muted text-sm font-medium">{t(`sections.${s.key}`)}</h3>
          {s.node}
        </section>
      ))}
    </>
  );
}

function useAgentActions(
  agent: AgentRow,
  form: AgentForm,
  startTransition: ReturnType<typeof useTransition>[1],
) {
  const t = useTranslations("settings.ai.agents");
  const router = useRouter();

  const submit = () =>
    startTransition(async () => {
      const result = await updateAgentAction({
        agentId: agent.id,
        ...agentFormToPayload(form),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });

  const remove = () => {
    if (!window.confirm(t("deleteConfirm", { name: agent.name }))) return;
    startTransition(async () => {
      const result = await deleteAgentAction(agent.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("deleted"));
      router.push("/app/settings/ai/agents");
    });
  };

  return { submit, remove };
}

function AgentDetailActions({
  agent,
  form,
  isSystem,
  pending,
  startTransition,
}: {
  agent: AgentRow;
  form: AgentForm;
  isSystem: boolean;
  pending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const t = useTranslations("settings.ai.agents");
  const { submit, remove } = useAgentActions(agent, form, startTransition);

  return (
    <div className="flex justify-between gap-2">
      {!isSystem ? (
        <Button size="sm" variant="danger" disabled={pending} onClick={remove}>
          {t("delete")}
        </Button>
      ) : (
        <span />
      )}
      <Button size="sm" disabled={pending || !form.name.trim()} onClick={submit}>
        {t("save")}
      </Button>
    </div>
  );
}
