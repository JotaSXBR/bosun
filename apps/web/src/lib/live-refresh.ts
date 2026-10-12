const INBOX_EVENTS = ["message.", "conversation.", "agent_suggestion."];
const SETTINGS_EVENTS = ["agent_suggestion.", "connection."];

/**
 * Whether a domain event mutates data rendered on `pathname` — every
 * refresh re-runs the whole server graph (~20 queries), so events that
 * don't touch the current page's data must not trigger one. Toasts for
 * `agent_suggestion.created` fire regardless — they're notifications,
 * not data sync.
 */
export function shouldRefreshForEvent(pathname: string, type: string): boolean {
  if (pathname.startsWith("/app/inbox")) {
    return INBOX_EVENTS.some((prefix) => type.startsWith(prefix));
  }
  if (pathname.startsWith("/app/contacts")) return type.startsWith("conversation.");
  if (pathname.startsWith("/app/integrations")) return type.startsWith("connection.");
  if (pathname.startsWith("/app/settings")) {
    return SETTINGS_EVENTS.some((prefix) => type.startsWith(prefix));
  }
  // /app home (onboarding), /app/deals, /app/setup — no event-driven data.
  return false;
}
