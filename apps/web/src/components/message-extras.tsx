"use client";

// Interactive islands inside the (server-rendered) message thread:
// per-message menu (react/reply/edit/delete), edited-history and
// "ver original" expanders. Mutations are server actions → router.refresh().
import { cn } from "@crm/ui/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { setReplyTarget } from "@/lib/reply-bridge";
import { useAction } from "@/lib/use-action";
import {
  deleteMessageAction,
  editMessageAction,
  getMessageOriginalAction,
  listMessageEditsAction,
  reactToMessageAction,
} from "@/server/actions/chat";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

type TargetProps = { conversationId: string; messageId: string };

/**
 * Per-message "⋯" menu: quick reactions, edit (own outbound text, ~15min
 * window enforced server-side) and delete-for-everyone.
 */
export function MessageMenu({
  conversationId,
  messageId,
  currentText,
  canReact,
  canEdit,
  canDelete,
  replyTarget,
}: TargetProps & {
  currentText: string;
  canReact: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Set on channel messages while the ticket is workable → shows "Responder". */
  replyTarget?: { externalId: string; preview: string } | undefined;
}) {
  const t = useTranslations("message");
  const tc = useTranslations("common");
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(currentText);

  if (!canReact && !canEdit && !canDelete && !replyTarget) return null;

  if (editing) {
    return (
      <MessageEditForm
        tc={tc}
        draft={draft}
        pending={pending}
        onDraftChange={setDraft}
        onCancel={() => {
          setEditing(false);
          setDraft(currentText);
        }}
        onSave={() =>
          run(async () => {
            const r = await editMessageAction({ conversationId, messageId, text: draft.trim() });
            if (r.ok) setEditing(false);
            return r;
          })
        }
      />
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label={t("menuAria")}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setConfirming(false);
        }}
        className="text-muted-foreground hover:text-foreground rounded px-1 text-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        ▾
      </button>
      {open && (
        <MessageMenuPanel
          t={t}
          tc={tc}
          canReact={canReact}
          canEdit={canEdit}
          canDelete={canDelete}
          confirming={confirming}
          pending={pending}
          onReact={(emoji) => {
            setOpen(false);
            run(() => reactToMessageAction({ conversationId, messageId, emoji }));
          }}
          onReply={
            replyTarget
              ? () => {
                  setOpen(false);
                  setReplyTarget(replyTarget);
                }
              : undefined
          }
          onEdit={() => {
            setOpen(false);
            setEditing(true);
          }}
          onDeleteStart={() => setConfirming(true)}
          onDeleteCancel={() => setConfirming(false)}
          onDeleteConfirm={() => run(() => deleteMessageAction({ conversationId, messageId }))}
        />
      )}
    </span>
  );
}

function MessageEditForm({
  draft,
  pending,
  onDraftChange,
  onSave,
  onCancel,
  tc,
}: {
  tc: ReturnType<typeof useTranslations>;
  draft: string;
  pending: boolean;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-1 space-y-1" data-testid="edit-message-form">
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={2}
        className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
        disabled={pending}
      />
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          className="bg-primary text-primary-foreground rounded px-2 py-1"
          disabled={pending || !draft.trim()}
          onClick={onSave}
        >
          {tc("save")}
        </button>
        <button type="button" className="rounded border px-2 py-1" onClick={onCancel}>
          {tc("cancel")}
        </button>
      </div>
    </div>
  );
}

function MessageMenuPanel({
  t,
  tc,
  canReact,
  canEdit,
  canDelete,
  confirming,
  pending,
  onReact,
  onReply,
  onEdit,
  onDeleteStart,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
  canReact: boolean;
  canEdit: boolean;
  canDelete: boolean;
  confirming: boolean;
  pending: boolean;
  onReact: (emoji: string) => void;
  onReply?: (() => void) | undefined;
  onEdit: () => void;
  onDeleteStart: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const item = "hover:bg-muted rounded px-2 py-1 text-left";
  return (
    <span
      className="bg-popover text-popover-foreground absolute top-full right-0 z-10 flex min-w-36 flex-col gap-0.5 rounded-md border p-1 text-xs shadow-md"
      data-testid="message-menu"
    >
      {canReact && (
        <span className="flex gap-0.5 px-1 py-0.5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="hover:bg-muted rounded p-0.5 text-base"
              onClick={() => onReact(emoji)}
            >
              {emoji}
            </button>
          ))}
        </span>
      )}
      {onReply && (
        <button type="button" className={item} onClick={onReply}>
          {t("reply")}
        </button>
      )}
      {canEdit && (
        <button type="button" className={item} onClick={onEdit}>
          {t("edit")}
        </button>
      )}
      {canDelete &&
        (confirming ? (
          <span className="flex items-center gap-1 px-2 py-1">
            {t("deleteConfirm")}
            <button
              type="button"
              className="text-destructive font-medium"
              disabled={pending}
              onClick={onDeleteConfirm}
            >
              {tc("yes")}
            </button>
            <button type="button" onClick={onDeleteCancel}>
              {tc("no")}
            </button>
          </span>
        ) : (
          <button type="button" className={cn(item, "text-destructive")} onClick={onDeleteStart}>
            {t("delete")}
          </button>
        ))}
    </span>
  );
}

/** "(editada)" — privileged roles can expand the previous versions. */
export function EditedIndicator({
  conversationId,
  messageId,
  canInspect,
}: TargetProps & { canInspect: boolean }) {
  const t = useTranslations("message");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [edits, setEdits] = useState<{ previousText: string | null; createdAt: string }[] | null>(
    null,
  );
  const { pending, run } = useAction();

  const toggle = () => {
    if (!canInspect) return;
    if (!open && edits === null) {
      run(async () => {
        const r = await listMessageEditsAction({ conversationId, messageId });
        if (r.ok) {
          setEdits(r.edits);
          setOpen(true);
        }
        return r;
      });
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || !canInspect}
        className={cn("italic", canInspect && "hover:underline")}
        title={canInspect ? t("viewEdits") : undefined}
      >
        {t("edited")}
      </button>
      {open && edits && (
        <span className="block text-left" data-testid="edit-history">
          {edits.length === 0 && <span className="block">{t("noEdits")}</span>}
          {edits.map((e) => (
            <span key={e.createdAt} className="block italic">
              “{e.previousText ?? t("mediaPlaceholder")}” ·{" "}
              {format.dateTime(new Date(e.createdAt), {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </span>
          ))}
        </span>
      )}
    </>
  );
}

/** Revoked placeholder extra — privileged roles may reveal the original. */
export function RevokedActions({ conversationId, messageId }: TargetProps) {
  const t = useTranslations("message");
  const [original, setOriginal] = useState<string | null>(null);
  const { pending, run } = useAction();
  return (
    <span className="block" data-testid="revoked-actions">
      <button
        type="button"
        className="text-xs underline"
        disabled={pending}
        onClick={() => {
          if (original !== null) {
            setOriginal(null);
            return;
          }
          run(async () => {
            const r = await getMessageOriginalAction({ conversationId, messageId });
            if (r.ok) setOriginal(r.text ?? t("mediaPlaceholder"));
            return r;
          });
        }}
      >
        {original === null ? t("viewOriginal") : t("hide")}
      </button>
      {original !== null && (
        <span className="mt-1 block rounded border border-dashed p-2 text-xs whitespace-pre-wrap">
          {original}
        </span>
      )}
    </span>
  );
}
