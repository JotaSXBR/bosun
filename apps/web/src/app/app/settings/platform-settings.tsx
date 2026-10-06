"use client";

import type { PlatformSettingGroup, PlatformSettingSummary } from "@crm/core/platform";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import { Input } from "@crm/ui/components/input";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { updatePlatformSettingAction } from "@/server/actions/platform";

type FieldDef = {
  path: string;
  label: string;
  kind?: "text" | "password" | "number" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  placeholder?: string;
  secret?: boolean;
};

const GROUP_DEFS: Record<
  PlatformSettingGroup,
  { title: string; description: string; fields: FieldDef[] }
> = {
  email: {
    title: "E-mail",
    description: "Provider de envio (verificação de conta, reset de senha).",
    fields: [
      {
        path: "provider",
        label: "Provider",
        kind: "select",
        options: [
          { value: "console", label: "console (só loga)" },
          { value: "resend", label: "resend" },
          { value: "smtp", label: "smtp" },
        ],
      },
      { path: "from", label: "Remetente (From)", placeholder: "Bosun <noreply@exemplo.com>" },
      { path: "resendApiKey", label: "Resend API key", secret: true },
      { path: "smtp.host", label: "SMTP host" },
      { path: "smtp.port", label: "SMTP port", kind: "number", placeholder: "587" },
      { path: "smtp.user", label: "SMTP user" },
      { path: "smtp.password", label: "SMTP password", secret: true },
      { path: "smtp.secure", label: "SMTP TLS/SSL", kind: "checkbox" },
    ],
  },
  billing: {
    title: "Cobrança (Asaas)",
    description: "Conta Asaas da plataforma — cobrança das organizações.",
    fields: [
      { path: "asaasApiKey", label: "API key", secret: true },
      {
        path: "asaasEnvironment",
        label: "Ambiente",
        kind: "select",
        options: [
          { value: "sandbox", label: "sandbox" },
          { value: "production", label: "production" },
        ],
      },
      { path: "asaasWebhookToken", label: "Webhook token", secret: true },
    ],
  },
  meta: {
    title: "Meta Cloud (WhatsApp oficial)",
    description:
      "Defaults de plataforma — campos deixados em branco na conexão caem nestes valores.",
    fields: [
      { path: "phoneNumberId", label: "Phone number ID" },
      { path: "graphApiVersion", label: "Graph API version", placeholder: "v26.0" },
      { path: "appSecret", label: "App secret", secret: true },
      { path: "verifyToken", label: "Verify token", secret: true },
      { path: "accessToken", label: "Access token", secret: true },
    ],
  },
  ai: {
    title: "IA (plataforma)",
    description: "Chaves de LLM da instância (fallback antes do BYOK por org).",
    fields: [
      { path: "openaiApiKey", label: "OpenAI API key", secret: true },
      { path: "anthropicApiKey", label: "Anthropic API key", secret: true },
    ],
  },
};

function fdString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
      obj,
    );
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  const leaf = parts.pop()!;
  const parent = parts.reduce<Record<string, unknown>>((acc, key) => {
    const next = acc[key];
    if (!next || typeof next !== "object") acc[key] = {};
    return acc[key] as Record<string, unknown>;
  }, obj);
  parent[leaf] = value;
}

function SelectInput({ id, field, current }: { id: string; field: FieldDef; current: unknown }) {
  return (
    <select
      id={id}
      name={field.path}
      defaultValue={typeof current === "string" ? current : ""}
      className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
    >
      <option value="">—</option>
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function FieldInput({
  group,
  field,
  summary,
}: {
  group: string;
  field: FieldDef;
  summary: PlatformSettingSummary;
}) {
  const current = getPath(summary.values, field.path);
  const isSecretSet = field.secret === true && summary.secretsSet[field.path] === true;
  const id = `${group}-${field.path}`;
  const shownValue =
    typeof current === "string" || typeof current === "number" ? String(current) : "";

  let control;
  if (field.kind === "select") {
    control = <SelectInput id={id} field={field} current={current} />;
  } else if (field.kind === "checkbox") {
    control = (
      <input
        id={id}
        name={field.path}
        type="checkbox"
        defaultChecked={current === true}
        className="border-input mt-2 h-4 w-4 rounded border"
      />
    );
  } else {
    control = (
      <Input
        id={id}
        name={field.path}
        type={field.secret ? "password" : field.kind === "number" ? "number" : "text"}
        autoComplete={field.secret ? "new-password" : "off"}
        defaultValue={field.secret ? "" : shownValue}
        placeholder={isSecretSet ? "•••••••• (configurado)" : field.placeholder}
      />
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {field.label}
        {summary.dbFields.includes(field.path) && (
          <span className="text-muted-foreground ml-1 text-xs">(banco)</span>
        )}
      </label>
      {control}
    </div>
  );
}

function GroupCard({ summary }: { summary: PlatformSettingSummary }) {
  const router = useRouter();
  const def = GROUP_DEFS[summary.group];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const field of def.fields) {
      if (field.kind === "checkbox") {
        setPath(values, field.path, fd.has(field.path));
      } else if (field.kind === "number") {
        const raw = fdString(fd, field.path);
        setPath(values, field.path, raw === "" ? "" : Number(raw));
      } else {
        setPath(values, field.path, fdString(fd, field.path));
      }
    }
    const result = await updatePlatformSettingAction({ group: summary.group, values });
    if (result.ok) {
      toast.success(`${def.title} salvo.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {def.title}
          {summary.configured ? (
            <span className="text-xs font-normal text-green-600">configurado</span>
          ) : (
            <span className="text-muted-foreground text-xs font-normal">não configurado</span>
          )}
        </CardTitle>
        <CardDescription>{def.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((field) => (
            <FieldInput key={field.path} group={summary.group} field={field} summary={summary} />
          ))}
          <div className="sm:col-span-2">
            <Button type="submit">Salvar {def.title}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Product settings groups — visible only to platform_admin (server-gated). */
export function PlatformSettings({ summaries }: { summaries: PlatformSettingSummary[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Plataforma</h2>
      {summaries.map((summary) => (
        <GroupCard key={summary.group} summary={summary} />
      ))}
    </section>
  );
}
