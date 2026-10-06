"use client";

// Agent-side chat presence: typing/recording states expire ~10s on the
// remote (WhatsApp) side, so active states are re-sent on a ~4s throttle
// and "paused" fires after ~9s of inactivity — matching the WhatsApp UX.
import { useCallback, useEffect, useRef } from "react";

import { sendChatPresenceAction } from "@/server/actions/chat";

const REFRESH_MS = 4_000;
const IDLE_MS = 9_000;

type ActivePresence = "typing" | "recording";

/**
 * Returns `signal(presence)` — call on every keystroke/recording tick —
 * and `pause()`; cleanup pauses on unmount. Sends at most one presence per
 * REFRESH_MS and schedules an automatic "paused" after IDLE_MS idle.
 */
export function useChatPresence(conversationId: string, enabled: boolean) {
  const lastSentAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);

  const pause = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    lastSentAt.current = 0;
    if (active.current && enabled) {
      active.current = false;
      void sendChatPresenceAction({ conversationId, presence: "paused" });
    }
  }, [conversationId, enabled]);

  const signal = useCallback(
    (presence: ActivePresence) => {
      const now = Date.now();
      active.current = true;
      if (now - lastSentAt.current >= REFRESH_MS) {
        lastSentAt.current = now;
        void sendChatPresenceAction({ conversationId, presence });
      }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        active.current = false;
        void sendChatPresenceAction({ conversationId, presence: "paused" });
        idleTimer.current = null;
        lastSentAt.current = 0;
      }, IDLE_MS);
    },
    [conversationId],
  );

  useEffect(() => pause, [pause]);

  return { signal, pause };
}
