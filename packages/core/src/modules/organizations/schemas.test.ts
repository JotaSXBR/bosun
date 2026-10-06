import { describe, expect, it } from "vitest";

import { updateOrgSettingsInput } from "./schemas";

describe("updateOrgSettingsInput", () => {
  it("accepts ticketReopenWindowHours inside the 1–168h window", () => {
    for (const hours of [1, 48, 168]) {
      const parsed = updateOrgSettingsInput.parse({ ticketReopenWindowHours: hours });
      expect(parsed.ticketReopenWindowHours).toBe(hours);
    }
  });

  it("rejects ticketReopenWindowHours outside the window or non-integer", () => {
    for (const hours of [0, 169, -1, 1.5, "48"]) {
      expect(updateOrgSettingsInput.safeParse({ ticketReopenWindowHours: hours }).success).toBe(
        false,
      );
    }
  });

  it("treats an absent ticketReopenWindowHours as no-change", () => {
    const parsed = updateOrgSettingsInput.parse({ locale: "pt-BR" });
    expect(parsed.ticketReopenWindowHours).toBeUndefined();
  });
});
