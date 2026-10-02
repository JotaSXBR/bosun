import type { Logger } from "./logger";
import { logger } from "./logger";

export type ErrorReporter = {
  captureException(error: unknown, context?: Record<string, unknown>): void;
};

/**
 * Error reporting facade — the only API domain code and packages may use.
 * The concrete backend (Sentry/GlitchTip/…) is installed once in
 * apps/web/instrumentation.ts. Default: logs through the JSON logger.
 */
let reporter: ErrorReporter = {
  captureException(error, context) {
    logger.error("unhandled exception", {
      error: serializeError(error),
      ...(context ?? {}),
    });
  },
};

export function setErrorReporter(next: ErrorReporter): void {
  reporter = next;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    reporter.captureException(error, context);
  } catch (reporterError) {
    logger.error("error reporter failed", { error: serializeError(reporterError) });
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export { type Logger };
