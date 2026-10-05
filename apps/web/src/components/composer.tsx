"use client";

import { Button } from "@crm/ui/components/button";
import { Textarea } from "@crm/ui/components/textarea";
import { cn } from "@crm/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addInternalNoteAction, sendOutboundMessageAction } from "@/server/actions/messaging";

type Mode = "reply" | "note";

export function Composer({
  conversationId,
  disabled,
}: {
  conversationId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result =
        mode === "reply"
          ? await sendOutboundMessageAction({ conversationId, text: trimmed })
          : await addInternalNoteAction({ conversationId, text: trimmed });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2 border-t pt-4" data-testid="composer">
      <div className="flex gap-1" role="tablist" aria-label="Tipo de mensagem">
        {(
          [
            { key: "reply", label: "Responder" },
            { key: "note", label: "Nota interna" },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m.key
                ? m.key === "note"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          disabled
            ? "Ticket resolvido — reabra para responder."
            : mode === "reply"
              ? "Responder ao cliente…"
              : "Nota interna (nunca enviada ao cliente)…"
        }
        disabled={disabled || pending}
        rows={3}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send();
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Ctrl+Enter envia</span>
        <Button onClick={send} disabled={disabled || pending || !text.trim()}>
          {pending ? "Enviando…" : mode === "reply" ? "Enviar" : "Adicionar nota"}
        </Button>
      </div>
    </div>
  );
}
