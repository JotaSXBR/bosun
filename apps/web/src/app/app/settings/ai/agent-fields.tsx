"use client";

import { Input } from "@crm/design-system/components/input";
import { Label } from "@crm/design-system/components/label";
import { Select } from "@crm/design-system/components/select";
import { Textarea } from "@crm/design-system/components/textarea";
import { useTranslations } from "next-intl";

import type { AgentForm } from "./agent-form-dialog";

export type FieldsProps = {
  form: AgentForm;
  setForm: (form: AgentForm) => void;
  pending: boolean;
};

/** Identidade: name, specialty, status. */
export function AgentIdentityFields({ form, setForm, pending }: FieldsProps) {
  const t = useTranslations("settings.ai.agents");
  return (
    <div className="grid gap-3 sm:grid-cols-3">
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
    </div>
  );
}

/** Modelo: provider + modelId. */
export function AgentModelFields({ form, setForm, pending }: FieldsProps) {
  const t = useTranslations("settings.ai.agents");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
  );
}

/** Comportamento: prompt + regras de negócio. */
export function AgentBehaviorFields({ form, setForm, pending }: FieldsProps) {
  const t = useTranslations("settings.ai.agents");
  return (
    <>
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
    </>
  );
}

export function AgentFormFields({ form, setForm, pending }: FieldsProps) {
  return (
    <>
      <AgentIdentityFields form={form} setForm={setForm} pending={pending} />
      <AgentModelFields form={form} setForm={setForm} pending={pending} />
      <AgentBehaviorFields form={form} setForm={setForm} pending={pending} />
      <AgentAdvancedFields form={form} setForm={setForm} pending={pending} />
    </>
  );
}

function AgentInput({
  id,
  label,
  pending,
  value,
  onChange,
  ...inputProps
}: {
  id: string;
  label: string;
  pending: boolean;
  value: string;
  onChange: (value: string) => void;
} & Pick<
  React.ComponentProps<typeof Input>,
  "type" | "min" | "max" | "maxLength" | "placeholder"
>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        shape="rounded"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        {...inputProps}
      />
    </div>
  );
}

/** Avançado: ferramentas, assinatura, limites de memória/execução. */
export function AgentAdvancedFields({ form, setForm, pending }: FieldsProps) {
  const t = useTranslations("settings.ai.agents");
  const bind = (key: keyof AgentForm) => ({
    value: form[key],
    onChange: (v: string) => setForm({ ...form, [key]: v }),
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AgentInput
        id="agent-tools"
        label={t("toolsAllowlist")}
        pending={pending}
        {...bind("toolsAllowlist")}
      />
      <AgentInput
        id="agent-signature"
        label={t("signatureLine")}
        pending={pending}
        maxLength={280}
        {...bind("signatureLine")}
      />
      <AgentInput
        id="agent-memory"
        label={t("memoryTokenCap")}
        pending={pending}
        type="number"
        min={256}
        max={128000}
        {...bind("memoryTokenCap")}
      />
      <AgentInput
        id="agent-maxtools"
        label={t("toolExecutionLimit")}
        pending={pending}
        type="number"
        min={1}
        max={50}
        {...bind("toolExecutionLimit")}
      />
    </div>
  );
}
