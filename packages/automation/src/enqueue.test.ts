import { describe, expect, it } from "vitest";

import { enqueueChannelEventProcessed, enqueueOrganizationOnboarding } from "./enqueue";

describe("enqueueOrganizationOnboarding", () => {
  it("skips when the jobs layer is not started", async () => {
    const result = await enqueueOrganizationOnboarding({
      organizationId: "018f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
      actorUserId: "118f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
    });
    expect(result).toEqual({ skipped: true });
  });
});

describe("enqueueChannelEventProcessed", () => {
  it("skips when the jobs layer is not started", async () => {
    const result = await enqueueChannelEventProcessed({
      organizationId: "018f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
      channelConnectionId: "218f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
      eventType: "message.received",
    });
    expect(result).toEqual({ skipped: true });
  });
});
