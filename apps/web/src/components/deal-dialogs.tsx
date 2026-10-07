"use client";

import type { DealCardRow, StageRow } from "@crm/core/leads";
import { Button } from "@crm/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@crm/ui/components/dialog";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { PlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createDealAction,
  deleteDealAction,
  searchContactsAction,
  updateDealAction,
} from "@/server/actions/leads";
import type { ContactPickRow } from "@/server/services";

function ContactSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
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
        placeholder="Buscar contato…"
        aria-label="Buscar contato"
      />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label="Contato">
          <SelectValue placeholder="Selecione o contato" />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.displayName ?? c.channelUserId}
            </SelectItem>
          ))}
          {contacts.length === 0 && (
            <div className="text-muted-foreground px-2 py-1.5 text-xs">
              Nenhum contato encontrado.
            </div>
          )}
        </SelectContent>
      </Select>
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
  return (
    <div className="space-y-1.5">
      <Label>Campos personalizados</Label>
      {attrs.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={row.key}
            onChange={(e) =>
              setAttrs(attrs.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))
            }
            placeholder="campo"
            className="w-2/5"
            maxLength={100}
          />
          <Input
            value={row.value}
            onChange={(e) =>
              setAttrs(attrs.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))
            }
            placeholder="valor"
            className="flex-1"
            maxLength={500}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 p-0"
            aria-label="Remover campo"
            onClick={() => setAttrs(attrs.filter((_, i) => i !== index))}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAttrs([...attrs, { key: "", value: "" }])}
      >
        <PlusIcon className="size-3.5" /> Campo
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
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="deal-title">Título</Label>
        <Input
          id="deal-title"
          value={form.title}
          onChange={(e) => setForm({ title: e.target.value })}
          maxLength={200}
        />
      </div>
      {!editing && (
        <div className="space-y-1.5">
          <Label>Contato</Label>
          <ContactSelect value={form.contactId} onChange={(contactId) => setForm({ contactId })} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deal-stage">Etapa</Label>
          <Select
            value={form.stageId}
            onValueChange={(stageId) => setForm({ stageId })}
            disabled={editing}
          >
            <SelectTrigger id="deal-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-value">Valor (R$)</Label>
          <Input
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
        toast.success(editing ? "Deal atualizado" : "Deal criado");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const canSubmit = title.trim() && stageId && (editing || contactId) && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar deal" : "Novo deal"}</DialogTitle>
        </DialogHeader>
        <DealFormFields editing={editing} stages={stages} form={form} setForm={setForm} />
        <DialogFooter>
          <Button onClick={submit} disabled={!canSubmit}>
            {editing ? "Salvar" : "Criar deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDealDialog({
  deal,
  open,
  onOpenChange,
}: {
  deal: DealCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir deal</DialogTitle>
          <DialogDescription>
            Excluir &quot;{deal.title}&quot;? A conversa vinculada não é afetada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteDealAction(deal.id, deal.conversationId ?? undefined);
                if (result.ok) {
                  toast.success("Deal excluído");
                  onOpenChange(false);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Excluir deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
