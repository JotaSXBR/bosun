import { describe, expect, it } from "vitest";

import {
  ForeignKeyViolationError,
  isForeignKeyViolation,
  isPgError,
  isUniqueViolation,
  PgError,
  toPgError,
  translatePgErrors,
  UniqueViolationError,
} from "./pg-error";

/** Minimal postgres.js error shape — `severity_local` is the fingerprint. */
function pgError(code: string, constraint?: string) {
  return {
    code,
    severity_local: "ERROR",
    constraint_name: constraint,
    message: `pg ${code}`,
  };
}

describe("toPgError", () => {
  it("maps known SQLSTATEs to subclasses, unknown to PgError", () => {
    expect(toPgError(pgError("23505", "uniq_idx"))).toBeInstanceOf(UniqueViolationError);
    expect(toPgError(pgError("23503"))).toBeInstanceOf(ForeignKeyViolationError);
    expect(toPgError(pgError("40001"))).toBeInstanceOf(PgError);
    expect(toPgError(pgError("40001"))).not.toBeInstanceOf(UniqueViolationError);
  });

  it("unwraps drizzle-style cause chains (single and double)", () => {
    const drizzle = Object.assign(new Error("Failed query"), { cause: pgError("23505", "x") });
    expect(toPgError(drizzle)?.constraintName).toBe("x");

    const double = Object.assign(new Error("tx failed"), { cause: drizzle });
    expect(toPgError(double)).toBeInstanceOf(UniqueViolationError);
  });

  it("passes PgError instances through unchanged", () => {
    const typed = toPgError(pgError("23505", "x"));
    expect(toPgError(typed)).toBe(typed);
  });

  it("returns null for non-pg errors — including `code` fields that are not SQLSTATEs", () => {
    expect(toPgError(new Error("nope"))).toBeNull();
    expect(toPgError(undefined)).toBeNull();
    expect(toPgError({ cause: null })).toBeNull();
    expect(toPgError({ code: "ECONNREFUSED" })).toBeNull();
    // SQLSTATE shape but missing the postgres.js fingerprint.
    expect(toPgError({ code: "23505" })).toBeNull();
  });
});

describe("translatePgErrors", () => {
  it("rethrows pg errors as typed instances", async () => {
    const failing = () =>
      Promise.reject(Object.assign(new Error("q"), { cause: pgError("23505") }));
    await expect(translatePgErrors(failing)).rejects.toBeInstanceOf(UniqueViolationError);
  });

  it("rethrows non-pg errors untouched and returns values", async () => {
    const other = new Error("boom");
    await expect(translatePgErrors(() => Promise.reject(other))).rejects.toBe(other);
    await expect(translatePgErrors(() => Promise.resolve(42))).resolves.toBe(42);
  });
});

describe("predicates", () => {
  it("isUniqueViolation matches code and optional constraint", () => {
    const wrapped = Object.assign(new Error("q"), { cause: pgError("23505", "uniq_idx") });
    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isUniqueViolation(wrapped, "uniq_idx")).toBe(true);
    expect(isUniqueViolation(wrapped, "other_idx")).toBe(false);
    expect(isUniqueViolation(pgError("23503"))).toBe(false);
  });

  it("isForeignKeyViolation and isPgError", () => {
    expect(isForeignKeyViolation(pgError("23503", "fk_idx"), "fk_idx")).toBe(true);
    expect(isForeignKeyViolation(pgError("23505"))).toBe(false);
    expect(isPgError(pgError("40001"), "40001")).toBe(true);
    expect(isPgError(pgError("23505", "idx"), "23505", "other")).toBe(false);
  });
});
