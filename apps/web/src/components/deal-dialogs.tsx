"use client";

import type { DealCardRow, StageRow } from "@crm/core/leads";
import { Button } from "@crm/ui/components/button";
import { Dialog } from "@crm/ui/components/dialog";
import { IconButton } from "@crm/ui/components/icon-button";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import { Select } from "@crm/ui/components/select";
import { toast } from "@crm/ui/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { createDealAction, searchContactsAction, updateDealAction } from "@/server/actions/leads";
import type { ContactPickRow } from "@/server/services";

function ContactSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useTranslations("leads");
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<ContactPickRow[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchContactsAction(query || undefined).then((r) => {
        if (r.ok) setContacts(r.data);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("dealForm.searchContact")}
        aria-label={t("dealForm.searchContact")}
      />
      <Select
        options={contacts.map((c) => ({ value: c.id, label: c.displayName ?? c.channelUserId }))}
        value={value || undefined}
        onChange={onChange}
        placeholder={t("dealForm.selectContact")}
        aria-label={t("dealForm.contactAria")}
      />
      {contacts.length === 0 && (
        <p className="text-ink-muted text-xs">{t("dealForm.noContacts")}</p>
      )}
    </div>
  );
}

function toReais(valueCents: number): string {
  return valueCents > 0 ? (valueCents / 100).toFixed(2).replace(".", ",") : "";
}

function fromReais(raw: string): number | undefined {
  const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
}

interface AttrRow {
  key: string;
  value: string;
}

function attrsToRows(attrs: unknown): AttrRow[] {
  if (!attrs || typeof attrs !== "object") return [];
  return Object.entries(attrs).map(([key, v]) => ({ key, value: String(v ?? "") }));
}

function rowsToAttrs(rows: AttrRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    const k = key.trim();
    if (k) out[k] = value;
  }
  return out;
}

function CustomAttrsFields({
  attrs,
  setAttrs,
}: {
  attrs: AttrRow[];
  setAttrs: (a: AttrRow[]) => void;
}) {
  const t = useTranslations("leads");
  return (
    <div className="space-y-1.5">
      <Label>{t("dealForm.customAttrs")}</Label>
      {attrs.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            shape="rounded"
            value={row.key}
            onChange={(e) =>
              setAttrs(attrs.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))
            }
            placeholder={t("dealForm.attrKey")}
            className="w-2/5"
            maxLength={100}
          />
          <Input
            shape="rounded"
            value={row.value}
            onChange={(e) =>
              setAttrs(attrs.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))
            }
            placeholder={t("dealForm.attrValue")}
            className="flex-1"
            maxLength={500}
          />
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            icon="x"
            label={t("dealForm.removeField")}
            onClick={() => setAttrs(attrs.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        iconLeft="plus"
        onClick={() => setAttrs([...attrs, { key: "", value: "" }])}
      >
        {t("dealForm.addField")}
      </Button>
    </div>
  );
}

function pickStageId(
  deal: DealCardRow | undefined,
  defaultStageId: string | undefined,
  stages: StageRow[],
): string {
  return defaultStageId ?? deal?.stageId ?? stages[0]?.id ?? "";
}

interface DealFormState {
  title: string;
  stageId: string;
  contactId: string;
  value: string;
  attrs: AttrRow[];
}

function DealFormFields({
  editing,
  stages,
  form,
  setForm,
}: {
  editing: boolean;
  stages: StageRow[];
  form: DealFormState;
  setForm: (patch: Partial<DealFormState>) => void;
}) {
  const t = useTranslations("leads");
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="deal-title">{t("dealForm.title")}</Label>
        <Input
          shape="rounded"
          id="deal-title"
          value={form.title}
          onChange={(e) => setForm({ title: e.target.value })}
          maxLength={200}
        />
      </div>
      {!editing && (
        <div className="space-y-1.5">
          <Label>{t("dealForm.contact")}</Label>
          <ContactSelect value={form.contactId} onChange={(contactId) => setForm({ contactId })} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deal-stage">{t("dealForm.stage")}</Label>
          <Select
            options={stages.map((s) => ({ value: s.id, label: s.name }))}
            value={form.stageId || undefined}
            onChange={(stageId) => setForm({ stageId })}
            disabled={editing}
            id="deal-stage"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-value">{t("dealForm.value")}</Label>
          <Input
            shape="rounded"
            id="deal-value"
            value={form.value}
            onChange={(e) => setForm({ value: e.target.value })}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>
      </div>
      <CustomAttrsFields attrs={form.attrs} setAttrs={(attrs) => setForm({ attrs })} />
    </div>
  );
}

export function DealFormDialog({
  funnelId,
  stages,
  defaultStageId,
  deal,
  open,
  onOpenChange,
}: {
  funnelId: string;
  stages: StageRow[];
  defaultStageId?: string;
  deal?: DealCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const tc = useTranslations("common");
  const router = useRouter();
  const editing = Boolean(deal);
  const initialForm = (): DealFormState => ({
    title: deal?.title ?? "",
    stageId: pickStageId(deal, defaultStageId, stages),
    contactId: deal?.contactId ?? "",
    value: toReais(deal?.valueCents ?? 0),
    attrs: attrsToRows(deal?.customAttributes ?? {}),
  });
  const [form, setFormState] = useState<DealFormState>(initialForm);
  // Reset the form each time the dialog opens (mounted once, reused for create/edit).
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setFormState(initialForm());
  }
  const [pending, startTransition] = useTransition();
  const setForm = (patch: Partial<DealFormState>) =>
    setFormState((prev) => ({ ...prev, ...patch }));
  const { title, stageId, contactId, value, attrs } = form;

  function submit() {
    startTransition(async () => {
      const valueCents = value.trim() ? fromReais(value) : undefined;
      const result = editing
        ? await updateDealAction({
            dealId: deal!.id,
            title,
            valueCents,
            customAttributes: rowsToAttrs(attrs),
          })
        : await createDealAction({
            funnelId,
            stageId,
            contactId,
            title,
            valueCents,
            customAttributes: rowsToAttrs(attrs),
          });
      if (result.ok) {
        toast.success(editing ? t("dealForm.updated") : t("dealForm.created"));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const canSubmit = title.trim() && stageId && (editing || contactId) && !pending;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={editing ? t("dealForm.editTitle") : t("dealForm.newTitle")}
      footer={
        <Button variant="primary" onClick={submit} disabled={!canSubmit}>
          {editing ? tc("save") : t("dealForm.createSubmit")}
        </Button>
      }
    >
      <DealFormFields editing={editing} stages={stages} form={form} setForm={setForm} />
    </Dialog>
  );
}
