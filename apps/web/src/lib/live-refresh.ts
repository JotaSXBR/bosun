const INBOX_EVENTS = ["message.", "conversation.", "agent_suggestion."];
const SETTINGS_EVENTS = ["agent_suggestion.", "connection."];
// /app home cards: queue counts, AI reviews/stale memories, connection problems.
const HOME_EVENTS = ["conversation.", "agent_suggestion.", "connection."];
// Bell data lives in the layout on every /app page; its sources are the
// rare events only — chatty message./conversation. traffic stays scoped.
const SHELL_EVENTS = ["agent_suggestion.", "connection."];

/**
 * Whether a domain event mutates data rendered on `pathname` — every
 * refresh re-runs the whole server graph (~20 queries), so events that
 * don't touch the current page's data must not trigger one. Toasts for
 * `agent_suggestion.created` fire regardless — they're notifications,
 * not data sync.
 */
export function shouldRefreshForEvent(pathname: string, type: string): boolean {
  // Inteligência module: reviews/knowledge/memory render suggestion data.
  // /app/settings/channels is covered by the /app/settings branch (connection.*).
  // Generic /app pages (deals, setup, platform): only the layout bell re-renders.
  const prefixes =
    (pathname.startsWith("/app/inbox") && INBOX_EVENTS) ||
    (pathname.startsWith("/app/contacts") && ["conversation."]) ||
    (pathname.startsWith("/app/ai") && ["agent_suggestion."]) ||
    (pathname.startsWith("/app/settings") && SETTINGS_EVENTS) ||
    ((pathname === "/app" || pathname === "/app/") && HOME_EVENTS) ||
    (pathname.startsWith("/app") && SHELL_EVENTS);
  return prefixes ? prefixes.some((prefix) => type.startsWith(prefix)) : false;
}
