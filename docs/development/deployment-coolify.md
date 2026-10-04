# Deployment — Coolify

Server-side setup for the pipeline in `docs/development/cicd.md`. Staging
and production run on the same VPS (4 CPU / 10 GB RAM / 100 GB disk) — the
machine only pulls images; all building happens in GitHub Actions.

## One-time setup

### 1. GHCR registry auth (private image)

Coolify needs credentials to pull `ghcr.io/jotasxbr/bosun` (private repo ⇒
private package):

1. GitHub → Settings → Developer settings → Personal access tokens (classic)
   → create a PAT with **`read:packages`** scope.
2. Coolify → server → Docker registries (or project registry settings) →
   add `ghcr.io` with your GitHub username + the PAT.

### 2. Two "Docker Image" applications

| App             | Image                            | Domain       |
| --------------- | -------------------------------- | ------------ |
| `bosun-staging` | `ghcr.io/jotasxbr/bosun:staging` | staging host |
| `bosun`         | `ghcr.io/jotasxbr/bosun:prod`    | prod host    |

Each: **Ports Exposes** `3000`, health check `/api/health`, env vars below.
The mutable tags mean Coolify always pulls the latest pointer on deploy.

### 3. Deploy webhooks + API token

Per app: Configuration → Webhooks → copy **Deploy Webhook (auth required)**
(`https://<coolify>/api/v1/deploy?uuid=<uuid>&force=false`).

Then: Keys & Tokens → API Tokens → create token with **deploy** permission.

Store in GitHub repo secrets: `COOLIFY_WEBHOOK_STAGING`,
`COOLIFY_WEBHOOK_PRODUCTION`, `COOLIFY_TOKEN`.

## Components

- **Web**: the GHCR image (root `Dockerfile`); port 3000. Migrations run
  automatically in the container entrypoint before the server starts.
- **PostgreSQL 18 + pgvector**: Coolify Postgres service
  (`pgvector/pgvector:0.8.7-pg18-trixie`). Bootstrap the app role once
  (mirrors `docker/postgres/init/01-app-role.sh`):

  ```sql
  CREATE ROLE crm_app LOGIN PASSWORD '<strong>' NOSUPERUSER NOBYPASSRLS;
  GRANT CONNECT ON DATABASE crm TO crm_app;
  GRANT USAGE ON SCHEMA public TO crm_app;
  ```

  Migrations create per-table grants + default privileges. Backups: Coolify's
  scheduled `pg_dump` on the service.

- **Redis**: optional today (nothing uses it yet); add when rate
  limiting/pub-sub lands.
- **Trigger.dev**: self-host on a separate server per its requirements
  (`docker/trigger/selfhost.sh` as reference) or use Trigger Cloud.
- **S3**: external provider or a RustFS Coolify service; set `STORAGE_S3_*`.
- **Proxy**: Traefik/Caddy handled by Coolify; set `APP_URL` to the public
  origin.

## Migrations

No manual step — `entrypoint.sh` runs `node /migrate/migrate.mjs`
(idempotent) on every container start, using
`DATABASE_ADMIN_URL ?? DATABASE_URL`. Because migrations run as the owner
role, keep `DATABASE_ADMIN_URL` pointing at the privileged user.

Caveat: a bad migration blocks the container from starting (the previous
container keeps serving until the new one is healthy, per Coolify's
deployment behavior). Rollback plan lives in `cicd.md`.

## Environment variables

`NODE_ENV=production`, `APP_URL`, `DATABASE_URL` (crm_app),
`DATABASE_ADMIN_URL` (crm), `BETTER_AUTH_SECRET`, `REDIS_URL`,
`EMAIL_PROVIDER`+`EMAIL_FROM`+provider keys, `STORAGE_S3_*`, `TRIGGER_*`,
`SENTRY_DSN` (GlitchTip ok), `OTEL_EXPORTER_OTLP_ENDPOINT`, `LOG_LEVEL`,
plus provider keys as needed (`WAHA_*`, `META_*`, `ASAAS_*`, `OPENAI/ANTHROPIC`).

## Notes

- **No worker** — Trigger.dev handles jobs.
- Terraform-readiness: configuration is env-only + the Dockerfile; there is
  no Coolify-specific code, so the same image runs anywhere.
