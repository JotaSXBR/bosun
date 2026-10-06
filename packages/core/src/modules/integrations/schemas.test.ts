import { describe, expect, it } from "vitest";

import { wahaCredentialsSchema } from "./schemas";

const base = {
  baseUrl: "http://waha.internal:3000",
  apiKey: "key",
  webhookHmacKey: "hmac",
};

describe("wahaCredentialsSchema", () => {
  it("accepts a session name with letters, digits, dash and underscore", () => {
    expect(wahaCredentialsSchema.parse({ ...base, session: "loja-principal_2" }).session).toBe(
      "loja-principal_2",
    );
  });

  it("leaves session undefined when omitted (service assigns the fallback)", () => {
    expect(wahaCredentialsSchema.parse(base).session).toBeUndefined();
  });

  it.each(["minha sessão", "sessao/x", "a.b", "sessão!"])(
    "rejects URL-unsafe session name %j",
    (session) => {
      expect(wahaCredentialsSchema.safeParse({ ...base, session }).success).toBe(false);
    },
  );
});
