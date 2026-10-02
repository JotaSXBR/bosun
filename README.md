# CRM

Multi-tenant SaaS CRM monorepo (pnpm + Turborepo). Modular monolith: Next.js 16
app + shared `@crm/*` packages + Trigger.dev jobs. See
`docs/architecture/stack.md` for pinned versions and `docs/architecture/` for
design docs.

## Quickstart

```bash
pnpm install
cp .env.example .env        # single env source for the whole monorepo
pnpm infra:up               # Postgres 18 + pgvector, Redis, RustFS (compose project: crmv2)
pnpm db:migrate             # applies migrations as the owner role
pnpm db:seed                # demo org + users (dev only)
pnpm storage:init           # create the local RustFS bucket
pnpm dev                    # http://localhost:3000
```

Seed logins (dev password `Password123!`): `superadmin@crm.local` (platform admin);
demo org `Demo`: `owner@crm.local`, `admin@crm.local`, `manager@crm.local`, `agent@crm.local`.

## Commands

| Command                                                     | Description                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm install`                                              | install all workspace deps                                 |
| `pnpm dev` / `pnpm build`                                   | dev server / production build (turbo)                      |
| `pnpm lint` / `pnpm typecheck`                              | ESLint 9 flat config / `tsc --noEmit`                      |
| `pnpm test`                                                 | unit tests (`*.test.ts`, no infra)                         |
| `pnpm test:integration`                                     | integration tests (`*.int.test.ts`, needs Postgres+RustFS) |
| `pnpm test:e2e`                                             | Playwright e2e (apps/web)                                  |
| `pnpm format` / `format:check`                              | Prettier                                                   |
| `pnpm db:generate` / `db:migrate` / `db:seed` / `db:studio` | drizzle-kit / seed                                         |
| `pnpm storage:init`                                         | create the local S3 bucket (RustFS)                        |
| `pnpm infra:up` / `infra:down` / `infra:logs`               | docker compose lifecycle (project `crmv2`)                 |
| `pnpm infra:trigger:up` / `infra:trigger:down`              | optional self-hosted Trigger.dev                           |
| `pnpm jobs:dev`                                             | Trigger.dev dev runner                                     |

## Layout

- `apps/web` — Next.js 16 app (`@crm/web`)
- `packages/{config,db,permissions,core,auth,ui}` — domain/platform packages
- `packages/{observability,channels,billing,storage,email,ai,automation}` —
  provider abstractions (adapters isolated behind factories)
- `tooling/{typescript,eslint,prettier}` — shared configs
- `docker/` — local infra + `trigger/selfhost.sh`

## Docs

- `docs/architecture/` — overview, multi-tenancy, providers, realtime,
  observability, security, stack
- `docs/adr/` — architecture decision records
- `docs/database/`, `docs/domains/` — schema + domain map
- `docs/development/` — getting started, testing, jobs, Coolify deployment
- `AGENTS.md` — rules for AI agents/contributors
