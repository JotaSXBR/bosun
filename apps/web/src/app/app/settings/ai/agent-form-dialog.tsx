"use client";

import type { AgentRow } from "@crm/core/agents";
import { Button } from "@crm/design-system/components/button";
import { Dialog } from "@crm/design-system/components/dialog";
import { useTranslations } from "next-intl";

import { AgentFormFields } from "./agent-fields";

export type AgentForm = {
  name: string;
  specialty: string;
  status: "draft" | "active" | "paused";
  provider: "" | "openai" | "anthropic" | "openrouter";
  modelId: string;
  systemPrompt: string;
  businessRules: string;
  toolsAllowlist: string;
  signatureLine: string;
  memoryTokenCap: string;
  toolExecutionLimit: string;
};

export const EMPTY_AGENT_FORM: AgentForm = {
  name: "",
  specialty: "",
  status: "draft",
  provider: "",
  modelId: "",
  systemPrompt: "",
  businessRules: "",
  toolsAllowlist: "",
  signatureLine: "",
  memoryTokenCap: "",
  toolExecutionLimit: "",
};

function coerceStatus(status: string): AgentForm["status"] {
  return status === "active" || status === "paused" ? status : "draft";
}

export function agentToForm(agent: AgentRow): AgentForm {
  const ref = (agent.modelRef ?? {}) as { provider?: string; modelId?: string };
  return {
    name: agent.name,
    specialty: agent.specialty ?? "",
    status: coerceStatus(agent.status),
    provider: (ref.provider ?? "") as AgentForm["provider"],
    modelId: ref.modelId ?? "",
    systemPrompt: agent.systemPrompt,
    businessRules: agent.businessRules ?? "",
    toolsAllowlist: Array.isArray(agent.toolsAllowlist)
      ? (agent.toolsAllowlist as string[]).join(", ")
      : "",
    signatureLine: agent.signatureLine ?? "",
    memoryTokenCap: String(agent.memoryTokenCap ?? ""),
    toolExecutionLimit: String(agent.toolExecutionLimit ?? ""),
  };
}

export function agentFormToPayload(form: AgentForm) {
  const tools = form.toolsAllowlist
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    name: form.name.trim(),
    specialty: form.specialty.trim() || undefined,
    status: form.status,
    modelRef:
      form.provider && form.modelId.trim()
        ? { provider: form.provider, modelId: form.modelId.trim() }
        : null,
    systemPrompt: form.systemPrompt,
    businessRules: form.businessRules.trim() || null,
    toolsAllowlist: tools,
    signatureLine: form.signatureLine.trim() || null,
    memoryTokenCap: form.memoryTokenCap ? Number(form.memoryTokenCap) : null,
    toolExecutionLimit: form.toolExecutionLimit ? Number(form.toolExecutionLimit) : null,
  };
}

export function AgentFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AgentRow | null;
  form: AgentForm;
  setForm: (form: AgentForm) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("settings.ai.agents");
  const tc = useTranslations("common");

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={editing ? t("edit") : t("new")}
      description={t("description")}
      width={672}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={pending || !form.name.trim()}>
            {editing ? tc("save") : t("create")}
          </Button>
        </>
      }
    >
      <AgentFormFields form={form} setForm={setForm} pending={pending} />
    </Dialog>
  );
}
