import { describe, expect, it } from "vitest";

import { shouldRefreshForEvent } from "./live-refresh";

describe("shouldRefreshForEvent", () => {
  it("refreshes inbox pages on message/conversation/suggestion events", () => {
    for (const path of ["/app/inbox", "/app/inbox/9f9c3b9a-7a1e-4a0d-9f7c-0f8b0c0d0e0f"]) {
      expect(shouldRefreshForEvent(path, "message.created")).toBe(true);
      expect(shouldRefreshForEvent(path, "conversation.updated")).toBe(true);
      expect(shouldRefreshForEvent(path, "agent_suggestion.reviewed")).toBe(true);
    }
  });

  it("refreshes contacts only on conversation events (list shows conversationCount)", () => {
    expect(shouldRefreshForEvent("/app/contacts", "conversation.created")).toBe(true);
    expect(shouldRefreshForEvent("/app/contacts", "message.created")).toBe(false);
    expect(shouldRefreshForEvent("/app/contacts", "agent_suggestion.created")).toBe(false);
  });

  it("refreshes channels/settings only on their data events", () => {
    expect(shouldRefreshForEvent("/app/settings/channels", "connection.status")).toBe(true);
    expect(shouldRefreshForEvent("/app/settings/channels", "message.created")).toBe(false);
    expect(shouldRefreshForEvent("/app/settings/ai", "agent_suggestion.created")).toBe(true);
    expect(shouldRefreshForEvent("/app/settings", "connection.status")).toBe(true);
    expect(shouldRefreshForEvent("/app/settings", "message.received")).toBe(false);
  });

  it("never refreshes pages without event-driven data", () => {
    for (const path of ["/app", "/app/deals", "/app/setup"]) {
      expect(shouldRefreshForEvent(path, "message.created")).toBe(false);
      expect(shouldRefreshForEvent(path, "conversation.updated")).toBe(false);
    }
  });

  it("ignores unknown/missing types everywhere", () => {
    expect(shouldRefreshForEvent("/app/inbox", "")).toBe(false);
    expect(shouldRefreshForEvent("/app/inbox", "contact.presence")).toBe(false);
  });
});
