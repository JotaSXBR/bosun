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

/** Toast gates from account/notifications — defaults all on. */
export interface ToastPrefs {
  drafts: boolean;
  nudges: boolean;
  suggestions: boolean;
}

interface SuggestionToastArgs {
  event: DomainEvent;
  t: Translators;
  prefs: ToastPrefs;
  goToReviews: () => void;
}

/** Drafts surface as cards in the thread — toast just signals; config suggestions get a link. */
function toastSuggestion({ event, t, prefs, goToReviews }: SuggestionToastArgs) {
  if (event.targetType === "draft") {
    if (prefs.drafts) toast.info(t.drafts("newDraftToast"));
  } else if (event.targetType === "nudge") {
    if (prefs.nudges) toast.info(t.nudges("newNudgeToast"));
  } else if (prefs.suggestions) {
    toast.info(t.ai("newSuggestion"), {
      action: (
        <Button variant="secondary" size="sm" onClick={goToReviews}>
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
// Param defaults keep primitive effect deps — a fresh prefs object each
// render would resubscribe the SSE.
function useLiveRefresh(
  { drafts = true, nudges = true, suggestions = true }: Partial<ToastPrefs> = {},
  pathname: string,
) {
  const tAi = useTranslations("settings.ai.suggestions");
  const tDrafts = useTranslations("drafts");
  const tNudges = useTranslations("nudges");
  const router = useRouter();
  const [hasNew, setHasNew] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onEvent = (event: DomainEvent) => {
      if (event.type === "contact.presence") return;
      if (event.type === "agent_suggestion.created") {
        toastSuggestion({
          event,
          t: { drafts: tDrafts, nudges: tNudges, ai: tAi },
          prefs: { drafts, nudges, suggestions },
          goToReviews: () => router.push("/app/ai/reviews"),
        });
      }
      if (!shouldRefreshForEvent(pathname, String(event.type ?? ""))) return;
      setHasNew(true);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setHasNew(false), INDICATOR_MS);
    };
    return subscribeToDomainEvents(onEvent);
  }, [router, pathname, tAi, tDrafts, tNudges, drafts, nudges, suggestions]);

  return hasNew;
}

export function InboxLive({ toasts }: { toasts?: ToastPrefs }) {
  const t = useTranslations("inbox");
  const pathname = usePathname();
  const hasNew = useLiveRefresh(toasts, pathname);
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
