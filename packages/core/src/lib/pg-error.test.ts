import { describe, expect, it } from "vitest";

import { isPgError } from "./pg-error";

describe("isPgError", () => {
  it("matches a direct pg error", () => {
    const error = { code: "23505", constraint_name: "uniq_idx" };
    expect(isPgError(error, "23505")).toBe(true);
    expect(isPgError(error, "23505", "uniq_idx")).toBe(true);
    expect(isPgError(error, "23505", "other_idx")).toBe(false);
    expect(isPgError(error, "23503")).toBe(false);
  });

  it("unwraps drizzle-style cause chains", () => {
    // DrizzleQueryError shape: plain Error with `cause` = postgres error.
    const drizzle = Object.assign(new Error("Failed query"), {
      cause: { code: "23505", constraint_name: "uniq_idx" },
    });
    expect(isPgError(drizzle, "23505", "uniq_idx")).toBe(true);

    // Doubly-wrapped (e.g. tx rollback error wrapping the query error).
    const double = Object.assign(new Error("tx failed"), { cause: drizzle });
    expect(isPgError(double, "23505", "uniq_idx")).toBe(true);
  });

  it("returns false for non-pg errors and missing causes", () => {
    expect(isPgError(new Error("nope"), "23505")).toBe(false);
    expect(isPgError(undefined, "23505")).toBe(false);
    expect(isPgError({ cause: null }, "23505")).toBe(false);
    expect(isPgError({ code: "23505" }, "23503")).toBe(false);
  });
});
