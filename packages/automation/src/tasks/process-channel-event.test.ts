import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  offHours: vi.fn(),
  unsupported: vi.fn(),
}));

vi.mock("@crm/core/messaging", () => ({
  maybeSendOffHoursReply: mocks.offHours,
  maybeSendUnsupportedMediaReply: mocks.unsupported,
}));
vi.mock("@crm/db", () => ({ getDb: () => ({}) }));

import { processChannelEventHandler } from "./process-channel-event";

const payload = {
  organizationId: "018f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
  channelConnectionId: "218f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
  eventType: "message.received",
  conversationId: "318f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
  messageId: "418f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
} as const;

describe("processChannelEventHandler", () => {
  beforeEach(() => {
    mocks.offHours.mockReset();
    mocks.unsupported.mockReset();
  });

  it("skips the unsupported-media reply when off-hours answered this inbound", async () => {
    mocks.offHours.mockResolvedValue({ sent: true, messageId: "m1" });
    const result = await processChannelEventHandler(payload);
    expect(mocks.unsupported).not.toHaveBeenCalled();
    expect(result).toMatchObject({ offHoursReply: true, unsupportedMediaReply: false });
  });

  it("lets the unsupported-media reply run when off-hours didn't send", async () => {
    mocks.offHours.mockResolvedValue({ sent: false, reason: "within-hours" });
    mocks.unsupported.mockResolvedValue({ sent: true, messageId: "m2" });
    const result = await processChannelEventHandler(payload);
    expect(mocks.unsupported).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ unsupportedMediaReply: true });
  });

  it("ignores non-received events", async () => {
    const result = await processChannelEventHandler({ ...payload, eventType: "message.status" });
    expect(mocks.offHours).not.toHaveBeenCalled();
    expect(mocks.unsupported).not.toHaveBeenCalled();
    expect(result.received).toBe(true);
  });
});
