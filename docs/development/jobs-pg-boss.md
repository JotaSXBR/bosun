# Background jobs — pg-boss

Bosun runs background work **in-process** via [pg-boss](https://github.com/timgit/pg-boss)
on the same Postgres as the app (ADR 0016). No worker tier, no extra infra:
the web server's `register()` hook (`apps/web/instrumentation.ts`, nodejs
runtime only) calls `startJobs()` from `@crm/automation`.

## How it fits

```
POST /api/webhooks/... → withTenant tx { domain writes + emitDomainEvent + boss.send via fromDrizzle(tx, sql) }
                                                                              ↓ commit
                                                         pgboss.job row (same tx — no outbox)
                                                                              ↓
                                    pg-boss worker (in-process) → task handler → @crm/core services
```

- **Transactional enqueue**: `enqueueChannelEventProcessed(payload, tx)`
  passes the drizzle transaction through `fromDrizzle` — the job row
  commits or rolls back with the message write. A replayed/deduped webhook
  never enqueues.
- **No `@crm/core → @crm/automation` import**: the route handler injects the
  enqueue as `deps.enqueue` into `ingestChannelEvent` (dependency direction).
- **Graceful degradation**: before `startJobs()` resolves (unit tests, edge
  runtime) enqueue returns `{ skipped: true }` — callers never fail on a
  missing queue. A failed `startJobs()` logs + captures and leaves the web
  process up.

## Schema & permissions

`pgboss` schema is created by migration `0009_pgboss_jobs.sql` (generated
from `PgBoss.getConstructionPlans`) as the **migration owner role**; `crm_app`
gets DML + EXECUTE grants. The app boots with `migrate: false,
createSchema: false` — `crm_app` never runs DDL. Queues default to the shared
`job_common` partition (`partition: false`), so runtime `createQueue` is a
plain INSERT — no `CREATE SCHEMA` grant needed.

Upgrading pg-boss: bump the dependency, regenerate DDL via
`getMigrationPlans`/`getRollbackPlans` into a new migration — never let the
app auto-migrate.

## Queues

| Queue                     | Trigger                              | Handler                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `process-channel-event`   | enqueue inside ingest tx (per event) | fan-out — currently the off-hours auto-reply          |
| `organization-onboarding` | enqueue post-commit on org creation  | membership-derived TenantContext + audit event        |
| `close-resolved-tickets`  | `boss.schedule` `*/15 * * * *`       | `closeExpiredResolvedTickets` — materializes `closed` |

## Writing a task

1. `packages/automation/src/tasks/<name>.ts`: export a zod payload schema +
   a plain `async (payload: unknown)` handler that parses it. Payloads carry
   **identity only** (ids) — handlers rebuild context from the DB (see
   `organization-onboarding` for the TenantContext pattern). Tenant writes go
   through `withTenant`-scoped services; cross-tenant sweeps use
   `withServiceAccess` (the scheduler is a trusted system path).
2. Register the queue constant in `boss.ts` `QUEUES`, then `createQueue` +
   `work` (and `schedule` if recurring) inside `start()`.
3. Enqueue helper in `src/enqueue.ts` via `send(name, payload, tx?)` —
   pass `tx` whenever the call site already holds a transaction.

## Ops

- Jobs live/die with the web process: `pnpm dev` (or the deploy entrypoint)
  starts them; there is nothing separate to run.
- Inspect: `select * from pgboss.job order by created_on desc` — plus the
  `pgboss.queue` / `pgboss.schedule` catalog tables.
- Failed handlers retry with pg-boss defaults and land in `job` state
  `failed`; `logger.error` + `captureException` surface them.
