"use client";

import type { MemoryConfidence, MemoryEntryType, MemoryScope } from "@crm/core/brain";
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
import { Textarea } from "@crm/ui/components/textarea";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { searchContactsAction } from "@/server/actions/leads";
import type { ContactPickRow } from "@/server/services";

const TYPES: MemoryEntryType[] = [
  "pattern",
  "procedure",
  "faq_gap",
  "decision",
  "preference",
  "escalation",
  "persona",
  "metric",
];
const TYPE_LABEL: Record<MemoryEntryType, string> = {
  pattern: "typePattern",
  procedure: "typeProcedure",
  faq_gap: "typeFaqGap",
  decision: "typeDecision",
  preference: "typePreference",
  escalation: "typeEscalation",
  persona: "typePersona",
  metric: "typeMetric",
};

export type ProposeForm = {
  type: MemoryEntryType;
  scope: MemoryScope;
  teamId: string;
  contactId: string;
  content: string;
  confidence: MemoryConfidence;
  staleAfterDays: number;
  rationale: string;
};

export const emptyProposeForm: ProposeForm = {
  type: "pattern",
  scope: "org",
  teamId: "",
  contactId: "",
  content: "",
  confidence: "medium",
  staleAfterDays: 90,
  rationale: "",
};

function ContactPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("settings.ai.brain");
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
        placeholder={t("searchContact")}
        aria-label={t("searchContact")}
        disabled={disabled}
      />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={t("contact")}>
          <SelectValue placeholder={t("selectContact")} />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.displayName ?? c.channelUserId}
            </SelectItem>
          ))}
          {contacts.length === 0 && (
            <div className="text-muted-foreground px-2 py-1.5 text-xs">{t("noContacts")}</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProposeFields({
  form,
  set,
  teams,
  pending,
}: {
  form: ProposeForm;
  set: <K extends keyof ProposeForm>(key: K, value: ProposeForm[K]) => void;
  teams: Array<{ id: string; name: string }>;
  pending: boolean;
}) {
  const t = useTranslations("settings.ai.brain");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("type")}</Label>
          <Select
            value={form.type}
            onValueChange={(v) => set("type", v as MemoryEntryType)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(TYPE_LABEL[type])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("scope")}</Label>
          <Select
            value={form.scope}
            onValueChange={(v) => set("scope", v as MemoryScope)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="org">{t("scopeOrg")}</SelectItem>
              <SelectItem value="team">{t("scopeTeam")}</SelectItem>
              <SelectItem value="contact">{t("scopeContact")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {form.scope === "team" && (
        <div className="space-y-1">
          <Label>{t("team")}</Label>
          <Select value={form.teamId} onValueChange={(v) => set("teamId", v)} disabled={pending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {form.scope === "contact" && (
        <div className="space-y-1">
          <Label>{t("contact")}</Label>
          <ContactPicker
            value={form.contactId}
            onChange={(id) => set("contactId", id)}
            disabled={pending}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="brain-content">{t("content")}</Label>
        <Textarea
          id="brain-content"
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">{t("contentHint")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("confidence")}</Label>
          <Select
            value={form.confidence}
            onValueChange={(v) => set("confidence", v as MemoryConfidence)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("confidenceLow")}</SelectItem>
              <SelectItem value="medium">{t("confidenceMedium")}</SelectItem>
              <SelectItem value="high">{t("confidenceHigh")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="brain-stale">{t("staleAfterDays")}</Label>
          <Input
            id="brain-stale"
            type="number"
            min={1}
            max={730}
            value={form.staleAfterDays}
            onChange={(e) => set("staleAfterDays", Number(e.target.value) || 90)}
            disabled={pending}
          />
          <p className="text-muted-foreground text-xs">{t("staleAfterHint")}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="brain-rationale">{t("rationale")}</Label>
        <Textarea
          id="brain-rationale"
          value={form.rationale}
          onChange={(e) => set("rationale", e.target.value)}
          rows={2}
          maxLength={4000}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">{t("rationaleHint")}</p>
      </div>
    </div>
  );
}

/** Staging form — the proposal lands in the suggestion inbox, never in canon directly. */
export function BrainProposeDialog({
  open,
  onOpenChange,
  teams,
  form,
  setForm,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Array<{ id: string; name: string }>;
  form: ProposeForm;
  setForm: (v: ProposeForm) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("settings.ai.brain");
  const tc = useTranslations("common");
  const set = <K extends keyof ProposeForm>(key: K, value: ProposeForm[K]) =>
    setForm({ ...form, [key]: value });

  const scopeReady =
    form.scope === "org" ||
    (form.scope === "team" && form.teamId !== "") ||
    (form.scope === "contact" && form.contactId !== "");
  const valid = form.content.trim().length > 0 && form.rationale.trim().length > 0 && scopeReady;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("propose")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ProposeFields form={form} set={set} teams={teams} pending={pending} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={pending || !valid}
            data-testid="brain-propose-submit"
          >
            {t("propose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
