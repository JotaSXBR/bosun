import { describe, expect, it, vi } from "vitest";

vi.mock("@crm/observability", () => ({ captureException: vi.fn() }));

import { contactGoogleSyncHandler } from "./contact-google-sync";

describe("contactGoogleSyncHandler", () => {
  it("completes (never throws) on a malformed payload so the org's queue key is not held", async () => {
    await expect(contactGoogleSyncHandler({ organizationId: "nope" })).resolves.toEqual({
      ok: false,
    });
  });
});
