import { describe, expect, it } from "vitest";

import { updateContactProfileInput } from "./schemas";

const contactId = "0190b1a0-0000-7000-8000-000000000001";
const parse = (patch: Record<string, unknown>) =>
  updateContactProfileInput.safeParse({ contactId, ...patch });

describe("updateContactProfileInput — profile fields", () => {
  it("accepts a full profile", () => {
    const result = parse({
      company: "Acme Ltda",
      jobTitle: "Diretora",
      address: "Rua A, 10\nSão Paulo - SP",
      birthday: "1990-02-28",
      urls: ["https://acme.test", "http://acme.test/sobre"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty values, which clear the field", () => {
    const result = parse({ company: "", jobTitle: "", address: "", birthday: "", urls: [] });
    expect(result.success).toBe(true);
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "ftp://acme.test", "acme.test", ""])(
    "rejects the url %j",
    (url) => {
      expect(parse({ urls: [url] }).success).toBe(false);
    },
  );

  it("rejects more than 5 urls and urls over 300 chars", () => {
    const six = Array.from({ length: 6 }, (_, i) => `https://acme.test/${i}`);
    expect(parse({ urls: six }).success).toBe(false);
    expect(parse({ urls: [`https://acme.test/${"a".repeat(300)}`] }).success).toBe(false);
  });

  it.each(["2026-02-30", "26-1-1", "01/02/1990", "1990-13-01"])(
    "rejects the birthday %j",
    (birthday) => {
      expect(parse({ birthday }).success).toBe(false);
    },
  );

  it("enforces the length limits", () => {
    expect(parse({ company: "a".repeat(121) }).success).toBe(false);
    expect(parse({ jobTitle: "a".repeat(121) }).success).toBe(false);
    expect(parse({ address: "a".repeat(501) }).success).toBe(false);
  });
});
