"use client";

import type { AgentRow } from "@crm/core/agents";
import { Button } from "@crm/ui/components/button";
import { Dialog } from "@crm/ui/components/dialog";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import { Select } from "@crm/ui/components/select";
import { Textarea } from "@crm/ui/components/textarea";
import { useTranslations } from "next-intl";

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

function AgentFormFields({
  form,
  setForm,
  pending,
}: {
  form: AgentForm;
  setForm: (form: AgentForm) => void;
  pending: boolean;
}) {
  const t = useTranslations("settings.ai.agents");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="agent-name">{t("name")}</Label>
          <Input
            shape="rounded"
            id="agent-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={100}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="agent-specialty">{t("specialty")}</Label>
          <Input
            shape="rounded"
            id="agent-specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            maxLength={200}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label>{t("status")}</Label>
          <Select
            options={[
              { value: "draft", label: t("statusDraft") },
              { value: "active", label: t("statusActive") },
              { value: "paused", label: t("statusPaused") },
            ]}
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v as AgentForm["status"] })}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>{t("provider")}</Label>
            <Select
              options={[
                { value: "none", label: "—" },
                { value: "openrouter", label: "OpenRouter" },
                { value: "openai", label: "OpenAI" },
                { value: "anthropic", label: "Anthropic" },
              ]}
              value={form.provider || "none"}
              onChange={(v) =>
                setForm({ ...form, provider: v === "none" ? "" : (v as AgentForm["provider"]) })
              }
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="agent-model">{t("modelId")}</Label>
            <Input
              shape="rounded"
              id="agent-model"
              value={form.modelId}
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              placeholder="openai/gpt-5-mini"
              disabled={pending || !form.provider}
            />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="agent-prompt">{t("systemPrompt")}</Label>
        <Textarea
          id="agent-prompt"
          value={form.systemPrompt}
          onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
          rows={4}
          maxLength={8000}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="agent-rules">{t("businessRules")}</Label>
        <Textarea
          id="agent-rules"
          value={form.businessRules}
          onChange={(e) => setForm({ ...form, businessRules: e.target.value })}
          rows={2}
          maxLength={8000}
          disabled={pending}
        />
      </div>
      <AgentLimitFields form={form} setForm={setForm} pending={pending} />
    </>
  );
}

function AgentLimitFields({
  form,
  setForm,
  pending,
}: {
  form: AgentForm;
  setForm: (form: AgentForm) => void;
  pending: boolean;
}) {
  const t = useTranslations("settings.ai.agents");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="agent-tools">{t("toolsAllowlist")}</Label>
        <Input
          shape="rounded"
          id="agent-tools"
          value={form.toolsAllowlist}
          onChange={(e) => setForm({ ...form, toolsAllowlist: e.target.value })}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="agent-signature">{t("signatureLine")}</Label>
        <Input
          shape="rounded"
          id="agent-signature"
          value={form.signatureLine}
          onChange={(e) => setForm({ ...form, signatureLine: e.target.value })}
          maxLength={280}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="agent-memory">{t("memoryTokenCap")}</Label>
        <Input
          shape="rounded"
          id="agent-memory"
          type="number"
          min={256}
          max={128000}
          value={form.memoryTokenCap}
          onChange={(e) => setForm({ ...form, memoryTokenCap: e.target.value })}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="agent-maxtools">{t("toolExecutionLimit")}</Label>
        <Input
          shape="rounded"
          id="agent-maxtools"
          type="number"
          min={1}
          max={50}
          value={form.toolExecutionLimit}
          onChange={(e) => setForm({ ...form, toolExecutionLimit: e.target.value })}
          disabled={pending}
        />
      </div>
    </div>
  );
}
