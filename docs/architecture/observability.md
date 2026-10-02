# Observability

`@crm/observability` is the single surface for logs and error reporting —
packages never call vendor SDKs directly.

## Logging

`createLogger({ level, bindings })` → JSON lines on stdout/stderr shaped
`{ time, level, msg, ...bindings, ...fields }`, with `child(bindings)` for
scoped context. `LOG_LEVEL` filters output (default `info`). No pino — this
is a deliberate dependency-free logger.

**Redaction:** values under keys matching
`/pass(word)?|secret|token|authorization|cookie|api[-_]?key|access[-_]?key/i`
are replaced with `[REDACTED]`, recursively. Still: don't log secrets or PII.

## Error reporting

`captureException(error, context?)` routes to the configured reporter;
`setErrorReporter` installs one (instrumentation hooks Sentry in). Default
reporter logs via the logger. Domain code calls only `captureException`.

## Traces

`apps/web/instrumentation.ts`: when `OTEL_EXPORTER_OTLP_ENDPOINT` is set,
`registerOTel({ serviceName })` (from `@vercel/otel`) enables tracing with
Next.js instrumentation.

## Sentry / GlitchTip

When `SENTRY_DSN` is set (Node runtime), `@sentry/nextjs` `init` runs with
`tracesSampleRate: 0` (errors only; OTEL owns traces) and
`enableOpenTelemetrySetup: false` so Sentry doesn't install a competing
tracer provider. **GlitchTip works by pointing `SENTRY_DSN` at it** — same
DSN protocol. We do not use `withSentryConfig` (no source-map upload yet);
`onRequestError` forwards request errors to `captureException`.

## Conventions

- One log line per event; put context in fields, not interpolated strings.
- Log at `warn`/`error` with `msg` keys that grep well
  (`"organization.create failed"`).
