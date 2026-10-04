import { afterEach, describe, expect, it } from "vitest";

import { decryptJson, encryptJson } from "./crypto";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);
const ORIGINAL = process.env.CHANNEL_CREDENTIALS_KEY;

afterEach(() => {
  process.env.CHANNEL_CREDENTIALS_KEY = ORIGINAL;
});

describe("encryptJson/decryptJson", () => {
  it("round-trips a JSON value", () => {
    process.env.CHANNEL_CREDENTIALS_KEY = KEY_A;
    const payload = encryptJson({
      baseUrl: "http://waha:3000",
      apiKey: "secret",
      nested: { a: 1 },
    });
    expect(payload).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(decryptJson(payload)).toEqual({
      baseUrl: "http://waha:3000",
      apiKey: "secret",
      nested: { a: 1 },
    });
  });

  it("fails to decrypt with a different key", () => {
    process.env.CHANNEL_CREDENTIALS_KEY = KEY_A;
    const payload = encryptJson({ apiKey: "secret" });
    process.env.CHANNEL_CREDENTIALS_KEY = KEY_B;
    expect(() => decryptJson(payload)).toThrowError(/decrypt|key|corrupted/i);
  });

  it("fails on a tampered ciphertext (GCM auth tag)", () => {
    process.env.CHANNEL_CREDENTIALS_KEY = KEY_A;
    const payload = encryptJson({ apiKey: "secret" });
    const parts = payload.split(".");
    const tampered = Buffer.from(parts[3]!, "base64url");
    tampered[0] = tampered[0]! ^ 0xff;
    parts[3] = tampered.toString("base64url");
    expect(() => decryptJson(parts.join("."))).toThrowError(/decrypt/i);
  });

  it("throws a descriptive error when the key is missing", () => {
    delete process.env.CHANNEL_CREDENTIALS_KEY;
    expect(() => encryptJson({})).toThrowError(/CHANNEL_CREDENTIALS_KEY is not set/);
  });
});
