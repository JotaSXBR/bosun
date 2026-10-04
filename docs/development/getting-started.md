# Getting started

```bash
pnpm install
cp .env.example .env
pnpm infra:up        # Postgres 18+pgvector, Redis, RustFS (compose project: crmv2)
pnpm db:migrate
pnpm db:seed         # idempotent demo org + users
pnpm storage:init    # create the RustFS bucket
pnpm dev             # http://localhost:3000
```

Seed logins (dev password `Password123!`): `superadmin@crm.local` (platform admin);
demo org: `owner@crm.local`, `admin@crm.local`, `manager@crm.local`, `agent@crm.local`.
Demo org: `Demo` (`demo`).

Optional env: `CHANNEL_CREDENTIALS_KEY` (64 hex chars) encrypts
`channel_connections` credentials — required only for the Integrations
feature. Generate:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Windows notes

- Run commands from Git Bash (scripts use `sh` semantics; compose/selfhost
  helpers are bash).
- `pnpm db:seed`/tests spawn processes — if `spawn` errors appear, ensure
  `pnpm`/`node` are on PATH for Git Bash.

## Port conflicts

Postgres maps `${POSTGRES_PORT:-5432}:5432` — set `POSTGRES_PORT` in `.env`
(and match it in `DATABASE_URL`/`DATABASE_ADMIN_URL`) when another Postgres
already owns 5432. RustFS uses 9000/9001, Redis 6379.

## Compose project name

The project is `crmv2` — a sibling repo (`C:\Projetos\CRM`) already runs a
project named `crm`. Only ever manage `crmv2` containers/volumes.
