"use client";

import type { LabelRow } from "@crm/core/leads";
import { Avatar } from "@crm/design-system/components/avatar";
import { Badge } from "@crm/design-system/components/badge";
import { Card } from "@crm/design-system/components/card";
import { toast } from "@crm/design-system/components/toast";
import { cn } from "@crm/design-system/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { LabelPicker } from "@/components/label-picker";
import { paletteStyle } from "@/components/palette";
// (palette lives in .ts — same specifier)
import { updateContactProfileAction } from "@/server/actions/contacts";
import { setContactLabelsAction, setConversationLabelsAction } from "@/server/actions/leads";

/** Click-to-edit text field — Enter/blur commits, Esc cancels. */
function FichaField({
  label,
  value,
  placeholder,
  canWrite,
  onSave,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  canWrite: boolean;
  onSave: (next: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  multiline?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  const commit = () => {
    setEditing(false);
    if (draft.trim() === value) return;
    startTransition(async () => {
      const result = await onSave(draft.trim());
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  };

  if (!canWrite) {
    return <span className="text-ink block text-sm">{value || "—"}</span>;
  }
  if (editing) {
    const shared = {
      autoFocus: true,
      value: draft,
      disabled: pending,
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") setEditing(false);
        if (e.key === "Enter" && !multiline) commit();
      },
      "aria-label": label,
    };
    return multiline ? (
      <textarea
        {...shared}
        rows={3}
        className="bg-page border-line w-full rounded-xs border px-2 py-1 text-sm"
        onChange={(e) => setDraft(e.target.value)}
      />
    ) : (
      <input
        {...shared}
        className="bg-page border-line w-full rounded-xs border px-1.5 py-0.5 text-sm"
        onChange={(e) => setDraft(e.target.value)}
      />
    );
  }
  return (
    <button
      type="button"
      className="text-ink hover:bg-raised -mx-1 block w-full rounded-xs px-1 text-left text-sm"
      title={label}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || <span className="text-ink-muted">{placeholder}</span>}
    </button>
  );
}

/**
 * Contact ficha (E2) — avatar, editable name/email/phone/notes, contact
 * tags and the conversation's etiquetas in one card (Google-People-style
 * inline edit, local only — no channel sync).
 */
export function ContactFicha({
  contactId,
  conversationId,
  displayName,
  channelUserId,
  avatarUrl,
  metadata,
  contactLabels,
  conversationLabels,
  allLabels,
  canWrite,
  canManageLabels,
}: {
  contactId: string;
  conversationId: string;
  displayName: string;
  channelUserId: string;
  avatarUrl: string | null;
  metadata: Record<string, unknown>;
  contactLabels: LabelRow[];
  conversationLabels: LabelRow[];
  allLabels: LabelRow[];
  canWrite: boolean;
  canManageLabels: boolean;
}) {
  const t = useTranslations("inbox.ficha");
  const tl = useTranslations("leads");

  const metaStr = (key: string) => {
    const v = metadata[key];
    return typeof v === "string" ? v : "";
  };

  const saveField = (patch: {
    displayName?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => updateContactProfileAction({ contactId, ...patch });

  return (
    <Card bodyClassName="space-y-3 text-sm" title={t("title")} data-testid="contact-ficha">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl ?? undefined} name={displayName || channelUserId} size="lg" />
        <div className="min-w-0 flex-1">
          <FichaField
            label={t("name")}
            value={displayName}
            placeholder={t("namePlaceholder")}
            canWrite={canWrite}
            onSave={(v) => saveField({ displayName: v || undefined })}
          />
          <p className="text-ink-muted truncate px-1 text-xs" title={channelUserId}>
            {channelUserId}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div>
          <span className="text-ink-muted text-xs">{t("email")}</span>
          <FichaField
            label={t("email")}
            value={metaStr("email")}
            placeholder={t("add")}
            canWrite={canWrite}
            onSave={(v) => saveField({ email: v })}
          />
        </div>
        <div>
          <span className="text-ink-muted text-xs">{t("phone")}</span>
          <FichaField
            label={t("phone")}
            value={metaStr("phone")}
            placeholder={t("add")}
            canWrite={canWrite}
            onSave={(v) => saveField({ phone: v })}
          />
        </div>
        <div>
          <span className="text-ink-muted text-xs">{t("notes")}</span>
          <FichaField
            label={t("notes")}
            value={metaStr("notes")}
            placeholder={t("add")}
            canWrite={canWrite}
            multiline
            onSave={(v) => saveField({ notes: v })}
          />
        </div>
      </div>

      <div className="border-line space-y-1.5 border-t pt-2">
        <span className="text-ink-muted text-xs">{t("contactTags")}</span>
        <div className="flex flex-wrap gap-1">
          {contactLabels.map((label) => (
            <Badge
              key={label.id}
              tone="neutral"
              className={cn("text-xs", paletteStyle(label.color).chip)}
            >
              {label.name}
            </Badge>
          ))}
          {contactLabels.length === 0 && (
            <span className="text-ink-muted text-xs">{tl("panel.noLabelsShort")}</span>
          )}
        </div>
        {canWrite && (
          <LabelPicker
            allLabels={allLabels}
            selectedIds={contactLabels.map((l) => l.id)}
            canCreate={canManageLabels}
            onSave={async (labelIds) => {
              const result = await setContactLabelsAction({ contactId, labelIds });
              return result.ok
                ? { ok: true }
                : { ok: false, error: "error" in result ? result.error : undefined };
            }}
          />
        )}
      </div>

      <div className="border-line space-y-1.5 border-t pt-2">
        <span className="text-ink-muted text-xs">{t("conversationLabels")}</span>
        <div className="flex flex-wrap gap-1">
          {conversationLabels.map((label) => (
            <Badge
              key={label.id}
              tone="neutral"
              className={cn("text-xs", paletteStyle(label.color).chip)}
            >
              {label.name}
            </Badge>
          ))}
          {conversationLabels.length === 0 && (
            <span className="text-ink-muted text-xs">{tl("panel.noLabelsShort")}</span>
          )}
        </div>
        {canWrite && (
          <LabelPicker
            allLabels={allLabels}
            selectedIds={conversationLabels.map((l) => l.id)}
            canCreate={canManageLabels}
            onSave={async (labelIds) => {
              const result = await setConversationLabelsAction({ conversationId, labelIds });
              return result.ok
                ? { ok: true }
                : { ok: false, error: "error" in result ? result.error : undefined };
            }}
          />
        )}
      </div>
    </Card>
  );
}
