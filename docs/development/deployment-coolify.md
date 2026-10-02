# Deployment — Coolify

## Components

- **Web** (`apps/web/Dockerfile`): standalone Next.js image; port 3000.
- **PostgreSQL 18 + pgvector**: Coolify Postgres service
  (`pgvector/pgvector:0.8.7-pg18-trixie`). Bootstrap the app role once:

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

## Migrations (pre-deploy)

Run `pnpm db:migrate` with `DATABASE_ADMIN_URL` before starting the new web
image (Coolify "Execute Command" or a pre-deploy job).

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
