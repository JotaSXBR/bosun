# Background jobs — Trigger.dev

Tasks live in `packages/automation/src/tasks` (`schemaTask` + zod payload).
Enqueue helpers in `src/enqueue.ts` are best-effort: unconfigured → logs +
`{ skipped: true }`; enqueue failure never fails the request.

## Local dev (Trigger Cloud)

1. Create a project at https://cloud.trigger.dev (v4).
2. Set in `.env`:

   ```env
   TRIGGER_SECRET_KEY=tr_dev_...
   TRIGGER_PROJECT_REF=proj_...
   ```

3. `pnpm jobs:dev` (runs `trigger dev` in `@crm/automation`) — registers and
   runs tasks locally against the cloud dashboard.

## Self-host

`pnpm infra:trigger:up` → `docker/trigger/selfhost.sh` clones trigger.dev
`v4.7.2` into `docker/trigger/.trigger-selfhost/`, generates secrets and
starts webapp+worker. Needs ~6GB+ RAM; then set `TRIGGER_API_URL` +
`TRIGGER_SECRET_KEY` + `TRIGGER_PROJECT_REF`. See `docker/trigger/README.md`.

## Env vars

`TRIGGER_SECRET_KEY` (required), `TRIGGER_PROJECT_REF` (required),
`TRIGGER_API_URL` (only for self-host).
