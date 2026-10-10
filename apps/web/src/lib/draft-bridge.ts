"use client";

// Same bridge pattern as reply-bridge, but event-based: the draft card's
// "Editar" button publishes the draft body; the composer subscribes and
// fills the textarea (setState lives in the event callback, not an effect).
import { useEffect, useRef } from "react";

const listeners = new Set<(body: string) => void>();

export function publishDraftFill(body: string): void {
  for (const listener of listeners) listener(body);
}

export function subscribeDraftFill(callback: (body: string) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** React side of the bridge — subscribes once, fires `apply` on "Editar". */
export function useDraftFill(apply: (body: string) => void): void {
  // Latest-callback ref: `apply` is an inline closure that changes every
  // render — subscribing to it directly would re-subscribe every render.
  const ref = useRef(apply);
  useEffect(() => {
    ref.current = apply;
  });
  useEffect(() => subscribeDraftFill((body) => ref.current(body)), []);
}
