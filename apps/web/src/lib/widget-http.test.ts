import { describe, expect, it } from "vitest";

import { clientIp, rateLimit } from "./widget-http";

function withXff(value: string): Request {
  return new Request("https://app.example/api", {
    headers: { "x-forwarded-for": value },
  });
}

describe("clientIp", () => {
  it("takes the last XFF hop — the trusted proxy's view of the peer", () => {
    expect(clientIp(withXff("1.2.3.4, 203.0.113.9"))).toBe("203.0.113.9");
    expect(clientIp(withXff("203.0.113.9"))).toBe("203.0.113.9");
  });

  it("ignores a forged first hop — same real client, same key", () => {
    expect(clientIp(withXff("10.0.0.1, 198.51.100.7"))).toBe(
      clientIp(withXff("192.0.2.99, 198.51.100.7")),
    );
  });

  it("falls back to unknown without XFF or with an empty header", () => {
    expect(clientIp(new Request("https://app.example/api"))).toBe("unknown");
    expect(clientIp(withXff(""))).toBe("unknown");
    expect(clientIp(withXff("  , "))).toBe("unknown");
  });
});

describe("rateLimit via clientIp", () => {
  it("keeps applying the limit when the first XFF hop is rotated", () => {
    const key = () => `widget:session:${clientIp(withXff(`${Math.random()}.0.0.1, 198.51.100.7`))}`;
    for (let i = 0; i < 10; i += 1) {
      expect(rateLimit(key(), 10, 60_000)).toBe(true);
    }
    expect(rateLimit(key(), 10, 60_000)).toBe(false);
  });
});
