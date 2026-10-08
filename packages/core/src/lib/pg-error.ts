/**
 * Central place for reading Postgres driver errors. Drizzle wraps
 * postgres.js errors in `DrizzleQueryError` — the real pg fields
 * (`code`, `constraint_name`, `severity_local`) live on `error.cause`,
 * possibly several levels deep. Call sites must never inspect those
 * fields directly (lint-enforced); use the typed errors, the
 * `is*Violation` predicates, or `translatePgErrors` from this module.
 */

interface PostgresErrorShape {
  code: string;
  severity_local?: string;
  constraint_name?: string;
  message?: string;
}

const SQLSTATE = /^[0-9A-Z]{5}$/;
const MAX_CAUSE_DEPTH = 4;

/** SQLSTATE-shaped `code` + `severity_local` is the postgres.js error fingerprint. */
function looksLikePostgresError(value: unknown): value is PostgresErrorShape {
  const v = value as PostgresErrorShape | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.code === "string" &&
    SQLSTATE.test(v.code) &&
    typeof v.severity_local === "string"
  );
}

/** Normalized driver error — carries the SQLSTATE and the constraint name, if any. */
export class PgError extends Error {
  readonly code: string;
  readonly constraintName: string | undefined;

  constructor(source: PostgresErrorShape, options?: { cause?: unknown }) {
    super(source.message ?? `postgres error ${source.code}`, options);
    this.name = "PgError";
    this.code = source.code;
    this.constraintName = source.constraint_name;
  }
}

export class UniqueViolationError extends PgError {
  constructor(source: PostgresErrorShape, options?: { cause?: unknown }) {
    super(source, options);
    this.name = "UniqueViolationError";
  }
}

export class ForeignKeyViolationError extends PgError {
  constructor(source: PostgresErrorShape, options?: { cause?: unknown }) {
    super(source, options);
    this.name = "ForeignKeyViolationError";
  }
}

/**
 * Finds the postgres.js error in `error` or its `cause` chain (bounded)
 * and returns it as a typed `PgError`. Passes `PgError` instances
 * through unchanged; returns `null` for non-pg errors.
 */
export function toPgError(error: unknown): PgError | null {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current; depth += 1) {
    if (current instanceof PgError) return current;
    if (looksLikePostgresError(current)) {
      const cls =
        current.code === "23505"
          ? UniqueViolationError
          : current.code === "23503"
            ? ForeignKeyViolationError
            : PgError;
      return new cls(current, { cause: error });
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

/**
 * Runs `fn` and rethrows any pg error found in the `cause` chain as a
 * typed `PgError` — use when the error should propagate across frames
 * as a typed error instead of being inspected in place.
 */
export async function translatePgErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toPgError(error) ?? error;
  }
}

/** True when `error` (or its cause chain) is a pg error with `code` — and `constraint` when given. */
export function isPgError(error: unknown, code: string, constraint?: string): boolean {
  const pg = toPgError(error);
  return (
    pg !== null &&
    pg.code === code &&
    (constraint === undefined || pg.constraintName === constraint)
  );
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const pg = toPgError(error);
  return (
    pg instanceof UniqueViolationError &&
    (constraint === undefined || pg.constraintName === constraint)
  );
}

export function isForeignKeyViolation(error: unknown, constraint?: string): boolean {
  const pg = toPgError(error);
  return (
    pg instanceof ForeignKeyViolationError &&
    (constraint === undefined || pg.constraintName === constraint)
  );
}
