import { describe, expect, it } from "vitest";

import { DomainError } from "../../errors";
import { isWhatsAppChatId, normalizeWhatsAppChatId } from "./phone";

describe("normalizeWhatsAppChatId", () => {
  it("accepts + international digits and formats them as a chatId", () => {
    expect(normalizeWhatsAppChatId("+5511999998888")).toBe("5511999998888@c.us");
    expect(normalizeWhatsAppChatId("+55 11 99999-8888")).toBe("5511999998888@c.us");
    expect(normalizeWhatsAppChatId("+1 (415) 555-0132")).toBe("14155550132@c.us");
  });

  it("requires the leading + — digits alone never prove a country code", () => {
    // "11999998888" is a valid-length local BR mobile: accepting it would
    // silently create a wrong-country chatId.
    for (const bad of ["5511999998888", "11999998888", "011999998888", "+", "+0001234", "abc"]) {
      expect(() => normalizeWhatsAppChatId(bad), bad).toThrowError(DomainError);
      expect(() => normalizeWhatsAppChatId(bad), bad).toThrowError(
        expect.objectContaining({ code: "CONTACT_PHONE_INVALID" }),
      );
    }
  });

  it("rejects out-of-range lengths", () => {
    expect(() => normalizeWhatsAppChatId("+1234567")).toThrowError(
      expect.objectContaining({ code: "CONTACT_PHONE_INVALID" }),
    );
    expect(() => normalizeWhatsAppChatId("+1234567890123456")).toThrowError(
      expect.objectContaining({ code: "CONTACT_PHONE_INVALID" }),
    );
  });
});

describe("isWhatsAppChatId", () => {
  it("recognizes @c.us and @lid identities", () => {
    expect(isWhatsAppChatId("5511999998888@c.us")).toBe(true);
    expect(isWhatsAppChatId("16449842241553@lid")).toBe(true);
  });

  it("rejects e-mail and other channel identities", () => {
    expect(isWhatsAppChatId("visitor@example.com")).toBe(false);
    expect(isWhatsAppChatId("session-token")).toBe(false);
  });
});
