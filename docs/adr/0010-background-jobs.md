# 0010: Background jobs — Trigger.dev, no worker tier

Status: accepted

## Context

Onboarding and future jobs need retries, scheduling and visibility. A custom
worker means a second runtime to deploy, queue and monitor.

## Decision

Trigger.dev 4.7.2 (`@trigger.dev/sdk` `schemaTask`s in
`packages/automation`). Local dev uses Trigger Cloud (`pnpm jobs:dev`);
self-hosting is supported via `docker/trigger/selfhost.sh` (clones the
`v4.7.2` repo and runs its hosting compose — intentionally not in the default
compose, ~6GB+ RAM). **There is no `apps/worker`.**

Enqueue is best-effort: `enqueue*` helpers skip with a log when Trigger isn't
configured, and callers must not fail the request on enqueue errors.

## Consequences

- No extra deployable; retries/schedules/observability come from Trigger.
- Task payloads carry identity only; tasks rebuild TenantContext from DB.
- A future dedicated worker REQUIRES a new ADR covering: the problem, why
  Trigger.dev is insufficient, the workloads involved, operational impact
  (deploy, secrets, monitoring) and maintenance cost.

## Alternatives considered

- BullMQ + own worker: full queue ownership but a worker tier to operate —
  rejected for now.
- In-process `setTimeout` jobs: lost on restart, no retries — rejected.
