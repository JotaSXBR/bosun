# Architecture overview

**Modular monolith.** One deployable Next.js app (`apps/web`) contains all
HTTP/UI logic; domain behavior lives in `@crm/*` packages. Background work
runs on **Trigger.dev** (Cloud or self-hosted), invoked through
`@crm/automation` — there is no worker process to deploy separately.

## Package graph

```
apps/web
  ├─ @crm/auth        → @crm/db, @crm/config, @crm/permissions, @crm/email
  ├─ @crm/automation  → @crm/core, @crm/db, @crm/config, @crm/observability
  ├─ @crm/core        → @crm/db, @crm/permissions, @crm/observability
  ├─ @crm/channels    → @crm/observability            (WAHA, Meta adapters)
  ├─ @crm/billing     → @crm/observability            (Asaas adapter)
  ├─ @crm/storage     → (@crm/config for init script) (S3/RustFS)
  ├─ @crm/email       → @crm/config, @crm/observability
  ├─ @crm/ai          → @crm/core, @crm/permissions   (AI SDK)
  ├─ @crm/db          → drizzle-orm, postgres.js
  ├─ @crm/config      → zod (env)
  └─ @crm/permissions → better-auth access control
```

Rules: adapters are reached only through each package's factory; domain code
never imports a provider SDK; `@crm/observability` is the only error/log
surface for packages.

## Request flow

1. `proxy.ts` refreshes the session cookie (no authorization there).
2. Server Actions / route handlers build a `TenantContext` from the session's
   active organization (`apps/web/src/server/tenant.ts`).
3. Services (`@crm/core`) assert permissions, then hit repositories inside
   `withTenant` transactions so Postgres RLS sees `app.organization_id`.
4. Webhook routes (when added): `verifyWebhook` on the raw request, then the
   adapter normalizes to domain events → services.

## Where things live

- Frontend: `apps/web/src/app` + `@crm/ui` components.
- Backend: Server Actions in `apps/web/src/server`, domain services in
  `packages/core/src/modules`.
- Database: schema/migrations in `packages/db`, local Postgres via
  `docker/compose.yml`.
- Jobs: `packages/automation/src/tasks` (Trigger.dev).

See also: `multi-tenancy.md`, `providers.md`, `observability.md`,
`security.md`, `realtime.md`, `stack.md`.
