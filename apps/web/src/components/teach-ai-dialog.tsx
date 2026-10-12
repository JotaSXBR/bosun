"use client";

import { Button } from "@crm/design-system/components/button";
import { Dialog } from "@crm/design-system/components/dialog";
import { Input } from "@crm/design-system/components/input";
import { Label } from "@crm/design-system/components/label";
import { Select } from "@crm/design-system/components/select";
import { Textarea } from "@crm/design-system/components/textarea";
import { toast } from "@crm/design-system/components/toast";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { proposeKnowledgeEntryAction, proposeMemoryEntryAction } from "@/server/actions/ai";

const MEMORY_TYPES = [
  "pattern",
  "procedure",
  "faq_gap",
  "decision",
  "preference",
  "escalation",
  "persona",
  "metric",
] as const;

type TeachFields = {
  kind: "knowledge" | "memory";
  memoryType: (typeof MEMORY_TYPES)[number];
  title: string;
  content: string;
  rationale: string;
};

function memoryTypeKey(v: (typeof MEMORY_TYPES)[number]) {
  return `type${v === "faq_gap" ? "FaqGap" : v.charAt(0).toUpperCase() + v.slice(1)}` as const;
}

/**
 * "Ensinar a IA" (IA spec §7.3) — stages a proposal in Revisões from the
 * conversation. Any member with messaging:write teaches knowledge; memory
 * proposals stay owner/admin (§7.4). Opening the dialog captures the current
 * text selection as the excerpt.
 */
export function TeachAiDialog({
  conversationId,
  canTeachMemory,
}: {
  conversationId: string;
  canTeachMemory: boolean;
}) {
  const t = useTranslations("inbox.teachAi");
  const [open, setOpen] = useState(false);
  const [excerpt, setExcerpt] = useState("");

  const openDialog = () => {
    setExcerpt(window.getSelection()?.toString().trim() ?? "");
    setOpen(true);
  };

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={openDialog}>
        {t("open")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("title")}>
        <TeachAiForm
          key={String(open)}
          conversationId={conversationId}
          canTeachMemory={canTeachMemory}
          initialContent={excerpt}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}

function useTeachSubmit(
  fields: TeachFields,
  conversationId: string,
  onDone: () => void,
): [boolean, () => void] {
  const t = useTranslations("inbox.teachAi");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const result =
        fields.kind === "knowledge"
          ? await proposeKnowledgeEntryAction({
              title: fields.title.trim(),
              content: fields.content.trim(),
              rationale: fields.rationale.trim(),
              sourceConversationId: conversationId,
            })
          : await proposeMemoryEntryAction({
              type: fields.memoryType,
              scope: "org",
              content: fields.content.trim(),
              confidence: "medium",
              staleAfterDays: 90,
              sourceConversationIds: [conversationId],
              rationale: fields.rationale.trim(),
            });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("proposed"));
      onDone();
    });

  return [pending, submit];
}

function TeachAiForm({
  conversationId,
  canTeachMemory,
  initialContent,
  onDone,
}: {
  conversationId: string;
  canTeachMemory: boolean;
  initialContent: string;
  onDone: () => void;
}) {
  const t = useTranslations("inbox.teachAi");
  const [fields, setFields] = useState<TeachFields>({
    kind: "knowledge",
    memoryType: "pattern",
    title: "",
    content: initialContent,
    rationale: "",
  });
  const set = (patch: Partial<TeachFields>) => setFields((f) => ({ ...f, ...patch }));
  const valid =
    fields.content.trim() &&
    fields.rationale.trim() &&
    (fields.kind === "memory" || fields.title.trim());
  const [pending, submit] = useTeachSubmit(fields, conversationId, onDone);

  return (
    <div className="space-y-3">
      <TeachKindFields
        fields={fields}
        set={set}
        canTeachMemory={canTeachMemory}
        pending={pending}
      />
      <TeachContentFields fields={fields} set={set} pending={pending} />
      <div className="flex justify-end gap-2">
        <Button size="sm" disabled={pending || !valid} onClick={submit}>
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}

function TeachContentFields({
  fields,
  set,
  pending,
}: {
  fields: TeachFields;
  set: (patch: Partial<TeachFields>) => void;
  pending: boolean;
}) {
  const t = useTranslations("inbox.teachAi");
  return (
    <>
      <Field label={t("content")} htmlFor="teach-content">
        <Textarea
          id="teach-content"
          value={fields.content}
          onChange={(e) => set({ content: e.target.value })}
          rows={5}
          maxLength={20000}
          disabled={pending}
        />
      </Field>
      <Field label={t("rationale")} htmlFor="teach-rationale">
        <Textarea
          id="teach-rationale"
          value={fields.rationale}
          onChange={(e) => set({ rationale: e.target.value })}
          rows={2}
          maxLength={4000}
          disabled={pending}
        />
      </Field>
    </>
  );
}

function TeachKindFields({
  fields,
  set,
  canTeachMemory,
  pending,
}: {
  fields: TeachFields;
  set: (patch: Partial<TeachFields>) => void;
  canTeachMemory: boolean;
  pending: boolean;
}) {
  const t = useTranslations("inbox.teachAi");
  const tb = useTranslations("settings.ai.brain");
  return (
    <>
      <Field label={t("kind")}>
        <Select
          options={[
            { value: "knowledge", label: t("kindKnowledge") },
            ...(canTeachMemory ? [{ value: "memory", label: t("kindMemory") }] : []),
          ]}
          value={fields.kind}
          onChange={(v) => set({ kind: v as TeachFields["kind"] })}
          disabled={pending}
        />
      </Field>
      {fields.kind === "knowledge" ? (
        <Field label={t("entryTitle")} htmlFor="teach-title">
          <Input
            shape="rounded"
            id="teach-title"
            value={fields.title}
            onChange={(e) => set({ title: e.target.value })}
            maxLength={200}
            disabled={pending}
          />
        </Field>
      ) : (
        <Field label={t("memoryType")}>
          <Select
            options={MEMORY_TYPES.map((v) => ({ value: v, label: tb(memoryTypeKey(v)) }))}
            value={fields.memoryType}
            onChange={(v) => set({ memoryType: v as TeachFields["memoryType"] })}
            disabled={pending}
          />
        </Field>
      )}
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
