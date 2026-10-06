# 0016: Background jobs — pg-boss in-process

Status: accepted (supersedes the Trigger.dev decision in ADR 0010; the "no
`apps/worker`" constraint is kept — pg-boss runs inside the web process)

## Context

ADR 0010 picked Trigger.dev for retries/schedules/visibility, but it was
never actually deployed: enqueue stayed a no-op (`isConfigured("trigger")`)
because Trigger Cloud adds an external dependency and self-hosting costs
~6GB+ RAM. Meanwhile the roadmap accumulated real needs: the off-hours
auto-reply fan-out, and a materialized `closed` status that requires a
time-based sweep. Decision recorded in TODO.md on 2026-10-04: pg-boss over
BullMQ and self-host Trigger.dev — transactional enqueue in the same
Postgres (no outbox) and zero new infrastructure.

## Decision

**pg-boss** (`pg-boss` 12.35) in `packages/automation`, started by
`register()` in `apps/web/instrumentation.ts` on the nodejs runtime only.

- Schema `pgboss` is created by a **migration** (`0009_pgboss_jobs.sql`,
  generated from `PgBoss.getConstructionPlans`) owned by the migration
  role; `crm_app` receives DML+EXECUTE grants. The app starts with
  `migrate: false, createSchema: false` — `crm_app` never runs DDL.
- Queues default to the shared `job_common` partition (`partition: false`)
  so runtime `createQueue` is a plain INSERT — no `CREATE SCHEMA` grant.
- Enqueue inside the domain transaction via `boss.send(name, data, { db:
fromDrizzle(tx, sql) })`: `ingestChannelEvent` receives an optional
  `deps.enqueue` injected by the route (core never imports automation) —
  job row commits or rolls back with the message write.
- Handlers are plain async functions zod-validating their payload;
  payloads carry identity only and rebuild tenant context from the DB.
- Recurring work uses `boss.schedule` (e.g. `close-resolved-tickets`
  `*/15 * * * *`). A failed `startJobs()` logs + captures and leaves
  enqueues as `{ skipped: true }` no-ops — the web process stays up.

## Consequences

- One dependency added, one runtime removed: no Trigger service in dev,
  CI or Coolify; `TRIGGER_*` envs gone.
- pg-boss upgrades: regenerate DDL via `getMigrationPlans`/`getRollbackPlans`
  into a new migration instead of letting the app auto-migrate.
- Graceful degradation preserved: unstarted boss (tests, edge) → enqueue
  skips with a log; callers never fail on a missing queue.
- Multi-instance is safe (advisory locks in Postgres); mid-flight jobs on
  shutdown expire and retry — no drain logic in v1.

## Alternatives considered

- Keep Trigger.dev: requires cloud account or ~6GB self-host for a value
  we weren't running anyway — rejected (decision of 2026-10-04).
- BullMQ + Redis worker: real worker tier to deploy/monitor — rejected.
- pg_cron / periodic endpoint: extension availability and a new public
  cron surface — rejected.
