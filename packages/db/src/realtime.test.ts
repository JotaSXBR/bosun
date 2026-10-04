import { describe, expect, it } from "vitest";

import { DOMAIN_EVENTS_CHANNEL, domainEventSchema } from "./realtime";

describe("domainEventSchema", () => {
  it("parses a message.received-shaped event, keeping domain fields", () => {
    const parsed = domainEventSchema.parse({
      type: "message.received",
      organizationId: crypto.randomUUID(),
      conversationId: crypto.randomUUID(),
      messageId: crypto.randomUUID(),
      contactId: crypto.randomUUID(),
      sentAt: new Date("2024-02-01T00:00:00Z").toISOString(),
    });
    expect(parsed.type).toBe("message.received");
    expect(parsed.conversationId).toBeTypeOf("string");
  });

  it("rejects events without a valid organizationId or type", () => {
    const cases = [
      { type: "message.received" },
      { type: "message.received", organizationId: "not-a-uuid" },
      { organizationId: crypto.randomUUID() },
      "not-an-object",
    ];
    for (const value of cases) {
      expect(domainEventSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("DOMAIN_EVENTS_CHANNEL", () => {
  it("is the shared pg_notify channel name", () => {
    expect(DOMAIN_EVENTS_CHANNEL).toBe("crm_domain_events");
  });
});
