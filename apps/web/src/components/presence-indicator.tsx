"use client";

import { useEffect, useRef, useState } from "react";

import { subscribeToDomainEvents } from "@/lib/sse";
import { subscribeChatPresenceAction } from "@/server/actions/chat";

/** Remote presence expires ~10s — clear a bit after that. */
const PRESENCE_TTL_MS = 12_000;

type ContactPresence = "online" | "offline" | "typing" | "recording" | "paused";

const PRESENCE_LABEL: Partial<Record<ContactPresence, string>> = {
  online: "online",
  typing: "digitando…",
  recording: "gravando áudio…",
};

/**
 * Live contact presence under the ticket title: subscribes the session to
 * the chat's presence updates once (idempotent on the provider), then
 * renders the transient `contact.presence` stream events for this ticket.
 */
export function PresenceIndicator({ conversationId }: { conversationId: string }) {
  const [presence, setPresence] = useState<ContactPresence | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void subscribeChatPresenceAction({ conversationId });
    return subscribeToDomainEvents((event) => {
      if (event.type !== "contact.presence" || event.conversationId !== conversationId) return;
      const next = event.presence as ContactPresence;
      setPresence(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPresence(null), PRESENCE_TTL_MS);
    });
  }, [conversationId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const label = presence ? PRESENCE_LABEL[presence] : null;
  if (!label) return null;
  return (
    <span className="text-success text-xs font-normal" data-testid="contact-presence">
      {label}
    </span>
  );
}
