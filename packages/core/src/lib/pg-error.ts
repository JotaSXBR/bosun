/**
 * Drizzle wraps postgres.js errors in `DrizzleQueryError` — the real pg
 * fields (`code`, `constraint_name`) live on `error.cause`. Walks the
 * cause chain (bounded) and matches a SQLSTATE, optionally the
 * constraint name.
 */
export function isPgError(error: unknown, code: string, constraint?: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    const pg = current as { code?: string; constraint_name?: string; cause?: unknown };
    if (pg.code === code && (constraint === undefined || pg.constraint_name === constraint)) {
      return true;
    }
    current = pg.cause;
  }
  return false;
}
