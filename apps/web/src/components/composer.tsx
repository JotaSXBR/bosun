"use client";

import { Button } from "@crm/design-system/components/button";
import { Textarea } from "@crm/design-system/components/textarea";
import { toast } from "@crm/design-system/components/toast";
import { cn } from "@crm/design-system/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { VoiceRecorder } from "@/components/voice-recorder";
import { useChatPresence } from "@/lib/chat-presence";
import { setReplyTarget, useReplyTarget } from "@/lib/reply-bridge";
import { sendChannelMessageAction, sendMediaMessageAction } from "@/server/actions/chat";
import { addInternalNoteAction } from "@/server/actions/messaging";

type Mode = "reply" | "note";

// Common emoji set — no dependency; the OS renders glyphs natively.
const EMOJIS = (
  "😀 😄 😁 😂 🤣 😊 😍 😘 😎 🤔 😅 😢 😭 😡 👍 👎 🙏 👏 💪 🤝 ✅ ❌ " +
  "❤️ 💔 🔥 ✨ 🎉 🎂 ⚽ 🚀 💡 📌 📎 🕐 ☀️ 🌙 ⭐ 💬 📞 📷 🎵 🔒 💰"
).split(" ");

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const t = useTranslations("composer");
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={t("emojisTitle")}
        data-testid="emoji-button"
      >
        😊
      </Button>
      {open && (
        <div
          className="bg-raised shadow-raised absolute bottom-full left-0 z-10 mb-1 grid w-64 grid-cols-8 gap-0.5 rounded-md border p-1"
          data-testid="emoji-grid"
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="hover:bg-raised rounded-xs p-1 text-lg"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function ComposerToolbar({
  disabled,
  sendingMedia,
  channelTools,
  onEmoji,
  onAttach,
  recorder,
  hint,
  attachTitle,
}: {
  attachTitle: string;
  disabled: boolean;
  sendingMedia: boolean;
  /** Attach/voice reach the customer — hidden on the internal-note tab. */
  channelTools: boolean;
  onEmoji: (emoji: string) => void;
  onAttach: () => void;
  recorder: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <EmojiPicker onPick={onEmoji} />
      {channelTools && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || sendingMedia}
          onClick={onAttach}
          title={attachTitle}
          data-testid="attach-button"
        >
          📎
        </Button>
      )}
      {channelTools && recorder}
      <span className="text-ink-muted text-xs">{hint}</span>
    </div>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const t = useTranslations("composer");
  const MODES = [
    { key: "reply", label: t("tabReply") },
    { key: "note", label: t("tabNote") },
  ] as const;
  return (
    <div className="flex gap-1" role="tablist" aria-label={t("tabsAria")}>
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="tab"
          aria-selected={mode === m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === m.key
              ? m.key === "note"
                ? "bg-warning/15 text-warning"
                : "bg-signal text-ink-on-signal"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ReplyChip({ preview, onClear }: { preview: string; onClear: () => void }) {
  const t = useTranslations("composer");
  return (
    <div
      className="bg-raised border-l-success flex items-center justify-between rounded-md border-l-4 px-3 py-1.5 text-xs"
      data-testid="reply-preview"
    >
      <span className="line-clamp-1 italic opacity-80">↩ {preview}</span>
      <button
        type="button"
        className="text-ink-muted hover:text-ink px-1"
        onClick={onClear}
        aria-label={t("cancelReply")}
      >
        ✕
      </button>
    </div>
  );
}

export function Composer({
  conversationId,
  disabled,
}: {
  conversationId: string;
  disabled: boolean;
}) {
  const t = useTranslations("composer");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [sendingMedia, setSendingMedia] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const replyTo = useReplyTarget();
  // Presence only flows on the reply tab — internal notes never reach the remote.
  const presence = useChatPresence(conversationId, !disabled && mode === "reply");

  const insertEmoji = (emoji: string) => {
    const el = textarea.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const at = el.selectionStart;
    const next = text.slice(0, at) + emoji + text.slice(el.selectionEnd);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(at + emoji.length, at + emoji.length);
    });
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const replyToId = replyTo?.externalId;
    presence.pause();
    startTransition(async () => {
      const result =
        mode === "reply"
          ? await sendChannelMessageAction({
              conversationId,
              content: { type: "text", text: trimmed },
              ...(replyToId ? { replyToId } : {}),
            })
          : await addInternalNoteAction({ conversationId, text: trimmed });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      setReplyTarget(null);
      router.refresh();
    });
  };

  const sendFile = (file: File) => {
    const caption = text.trim();
    setSendingMedia(true);
    const form = new FormData();
    form.set("conversationId", conversationId);
    form.set("file", file);
    if (caption) form.set("caption", caption);
    if (replyTo) form.set("replyToId", replyTo.externalId);
    void sendMediaMessageAction(form).then((result) => {
      setSendingMedia(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      setReplyTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2 border-t pt-4" data-testid="composer">
      <ModeTabs mode={mode} onChange={setMode} />

      {replyTo && <ReplyChip preview={replyTo.preview} onClear={() => setReplyTarget(null)} />}

      <Textarea
        ref={textarea}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (mode === "reply") presence.signal("typing");
        }}
        placeholder={
          disabled
            ? t("placeholderDisabled")
            : mode === "reply"
              ? t("placeholderReply")
              : t("placeholderNote")
        }
        disabled={disabled || pending}
        rows={3}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send();
        }}
      />

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        aria-label={t("attach")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) sendFile(file);
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <ComposerToolbar
          disabled={disabled}
          sendingMedia={sendingMedia}
          channelTools={mode === "reply"}
          onEmoji={insertEmoji}
          onAttach={() => fileInput.current?.click()}
          attachTitle={t("attach")}
          recorder={
            <VoiceRecorder
              conversationId={conversationId}
              disabled={disabled}
              presence={presence}
            />
          }
          hint={sendingMedia ? t("hintSendingMedia") : t("hintSend")}
        />
        <Button variant="primary" onClick={send} disabled={disabled || pending || !text.trim()}>
          {pending ? t("sending") : mode === "reply" ? t("send") : t("addNote")}
        </Button>
      </div>
    </div>
  );
}
