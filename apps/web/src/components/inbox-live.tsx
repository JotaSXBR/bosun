"use client";

import { Button } from "@crm/design-system/components/button";
import { toast } from "@crm/design-system/components/toast";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { shouldRefreshForEvent } from "@/lib/live-refresh";
import type { DomainEvent } from "@/lib/sse";
import { subscribeToDomainEvents } from "@/lib/sse";

const REFRESH_DEBOUNCE_MS = 500;
const INDICATOR_MS = 8_000;

type Translators = {
  drafts: (key: string) => string;
  nudges: (key: string) => string;
  ai: (key: string) => string;
};

/** Drafts surface as cards in the thread — toast just signals; config suggestions get a link. */
function toastSuggestion(event: DomainEvent, t: Translators, goToSettings: () => void) {
  if (event.targetType === "draft") toast.info(t.drafts("newDraftToast"));
  else if (event.targetType === "nudge") toast.info(t.nudges("newNudgeToast"));
  else {
    toast.info(t.ai("newSuggestion"), {
      action: (
        <Button variant="secondary" size="sm" onClick={goToSettings}>
          {t.ai("title")}
        </Button>
      ),
    });
  }
}

/**
 * Keeps /app pages live: subscribes to the org-scoped SSE stream and
 * refreshes the current route (debounced) when a persistent domain event
 * arrives that affects this page (see `shouldRefreshForEvent`).
 * `contact.presence` is transient — it never triggers a refresh (the
 * conversation header renders it directly from the event payload).
 */
export function InboxLive() {
  const t = useTranslations("inbox");
  const tAi = useTranslations("settings.ai.suggestions");
  const tDrafts = useTranslations("drafts");
  const tNudges = useTranslations("nudges");
  const router = useRouter();
  const pathname = usePathname();
  const [hasNew, setHasNew] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeToDomainEvents((event) => {
      if (event.type === "contact.presence") return;
      if (event.type === "agent_suggestion.created") {
        toastSuggestion(event, { drafts: tDrafts, nudges: tNudges, ai: tAi }, () =>
          router.push("/app/ai/reviews"),
        );
      }
      if (!shouldRefreshForEvent(pathname, String(event.type ?? ""))) return;
      setHasNew(true);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setHasNew(false), INDICATOR_MS);
    });
  }, [router, pathname, tAi, tDrafts, tNudges]);

  if (!hasNew) return null;
  return (
    <div
      className="bg-success text-ink-inverse shadow-pop fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
      data-testid="inbox-live-indicator"
    >
      <span className="size-2 animate-pulse rounded-full bg-white" />
      {t("newMessage")}
    </div>
  );
}
