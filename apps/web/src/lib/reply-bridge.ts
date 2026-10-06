"use client";

// Tiny module-level pub/sub bridging the (server-rendered) message list and
// the composer: a message's "Responder" menu item publishes the quote
// target; the composer subscribes and renders the preview chip.
import { useSyncExternalStore } from "react";

export type ReplyTarget = {
  /** Channel-side id — what the provider sends as reply_to. */
  externalId: string;
  preview: string;
};

let target: ReplyTarget | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setReplyTarget(next: ReplyTarget | null): void {
  target = next;
  emit();
}

export function useReplyTarget(): ReplyTarget | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => target,
    () => null,
  );
}
