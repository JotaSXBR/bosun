import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger, redact } from "./logger";

describe("redact", () => {
  it("redacts sensitive keys deeply", () => {
    const input = {
      password: "x",
      nested: { apiKey: "k", api_key: "k2", access_token: "t", list: [{ secret: "s" }] },
      safe: "value",
    };
    const out = redact(input) as Record<string, unknown>;
    expect(out.password).toBe("[REDACTED]");
    const nested = out.nested as Record<string, unknown>;
    expect(nested.apiKey).toBe("[REDACTED]");
    expect(nested.api_key).toBe("[REDACTED]");
    expect(nested.access_token).toBe("[REDACTED]");
    expect((nested.list as Record<string, unknown>[])[0]?.secret).toBe("[REDACTED]");
    expect(nested.safe).toBeUndefined();
    expect(out.safe).toBe("value");
  });

  it("passes primitives through", () => {
    expect(redact("x")).toBe("x");
    expect(redact(3)).toBe(3);
    expect(redact(null)).toBeNull();
  });
});

describe("createLogger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("filters below the configured level", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const log = createLogger({ level: "warn" });
    log.info("hidden");
    log.debug("hidden too");
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("emits JSON lines with bindings and redacts fields", () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      out.push(String(chunk));
      return true;
    });
    const log = createLogger({ level: "debug", bindings: { service: "crm" } });
    log.info("hello", { token: "abc", ok: 1 });
    expect(out).toHaveLength(1);
    const record = JSON.parse(out[0]!) as Record<string, unknown>;
    expect(record.level).toBe("info");
    expect(record.msg).toBe("hello");
    expect(record.service).toBe("crm");
    expect(record.token).toBe("[REDACTED]");
    expect(record.ok).toBe(1);
    expect(typeof record.time).toBe("string");
  });

  it("warn/error go to stderr, child inherits bindings", () => {
    const err: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      err.push(String(chunk));
      return true;
    });
    const log = createLogger({ level: "debug", bindings: { service: "crm" } });
    log.child({ requestId: "r1" }).error("boom");
    const record = JSON.parse(err[0]!) as Record<string, unknown>;
    expect(record.level).toBe("error");
    expect(record.requestId).toBe("r1");
    expect(record.service).toBe("crm");
  });
});
