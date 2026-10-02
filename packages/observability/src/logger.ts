// Minimal structured logger: JSON lines to stdout (info/debug) and stderr
// (warn/error). No pino — dependency-free by design.

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SENSITIVE_KEY = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|access[-_]?key/i;
const REDACTED = "[REDACTED]";

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(val, depth + 1);
  }
  return out;
}

export type Logger = {
  debug: (msg: string, fields?: LogFields) => void;
  info: (msg: string, fields?: LogFields) => void;
  warn: (msg: string, fields?: LogFields) => void;
  error: (msg: string, fields?: LogFields) => void;
  child: (bindings: LogFields) => Logger;
};

export function createLogger(options: { level?: LogLevel; bindings?: LogFields }): Logger {
  const level = options.level ?? "info";
  const bindings = options.bindings ?? {};
  const threshold = LEVEL_ORDER[level];

  const emit = (lvl: LogLevel, msg: string, fields?: LogFields) => {
    if (LEVEL_ORDER[lvl] < threshold) return;
    const record = {
      time: new Date().toISOString(),
      level: lvl,
      msg,
      ...(redact({ ...bindings, ...(fields ?? {}) }) as LogFields),
    };
    const line = JSON.stringify(record);
    if (lvl === "warn" || lvl === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  };

  return {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (childBindings) => createLogger({ level, bindings: { ...bindings, ...childBindings } }),
  };
}

/** Default app logger; honors LOG_LEVEL when set in the environment. */
export const logger = createLogger({
  level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info",
});
