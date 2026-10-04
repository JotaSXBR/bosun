"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const REFRESH_DEBOUNCE_MS = 500;
const INDICATOR_MS = 8_000;

/**
 * Keeps /app pages live: opens the org-scoped SSE stream and refreshes the
 * current route (debounced) when a domain event arrives. EventSource
 * auto-reconnects (server sends `retry: 3000`). Renders a subtle "nova
 * mensagem" indicator for a few seconds after each event.
 */
export function InboxLive() {
  const router = useRouter();
  const [hasNew, setHasNew] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/conversations/stream");
    source.onmessage = () => {
      setHasNew(true);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setHasNew(false), INDICATOR_MS);
    };
    return () => {
      source.close();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [router]);

  if (!hasNew) return null;
  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
      data-testid="inbox-live-indicator"
    >
      <span className="size-2 animate-pulse rounded-full bg-white" />
      Nova mensagem
    </div>
  );
}
