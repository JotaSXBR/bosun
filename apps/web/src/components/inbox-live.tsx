"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { subscribeToDomainEvents } from "@/lib/sse";

const REFRESH_DEBOUNCE_MS = 500;
const INDICATOR_MS = 8_000;

/**
 * Keeps /app pages live: subscribes to the org-scoped SSE stream and
 * refreshes the current route (debounced) when a persistent domain event
 * arrives. `contact.presence` is transient — it never triggers a refresh
 * (the conversation header renders it directly from the event payload).
 */
export function InboxLive() {
  const t = useTranslations("inbox");
  const tAi = useTranslations("settings.ai.suggestions");
  const router = useRouter();
  const [hasNew, setHasNew] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeToDomainEvents((event) => {
      if (event.type === "contact.presence") return;
      if (event.type === "agent_suggestion.created") {
        toast.info(tAi("newSuggestion"), {
          action: { label: tAi("title"), onClick: () => router.push("/app/settings/ai") },
        });
      }
      setHasNew(true);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setHasNew(false), INDICATOR_MS);
    });
  }, [router, tAi]);

  if (!hasNew) return null;
  return (
    <div
      className="bg-success text-success-foreground fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg"
      data-testid="inbox-live-indicator"
    >
      <span className="size-2 animate-pulse rounded-full bg-white" />
      {t("newMessage")}
    </div>
  );
}
