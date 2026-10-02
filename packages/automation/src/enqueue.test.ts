import type { ServerEnv } from "@crm/config";
import { describe, expect, it } from "vitest";

import { enqueueOrganizationOnboarding } from "./enqueue";

const unconfiguredEnv = {
  trigger: { secretKey: undefined, apiUrl: undefined, projectRef: undefined },
} as unknown as ServerEnv;

describe("enqueueOrganizationOnboarding", () => {
  it("skips when Trigger.dev is not configured", async () => {
    const result = await enqueueOrganizationOnboarding(
      {
        organizationId: "018f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
        actorUserId: "118f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b",
      },
      unconfiguredEnv,
    );
    expect(result).toEqual({ skipped: true });
  });
});
