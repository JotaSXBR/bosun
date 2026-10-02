# Database

PostgreSQL 18 + pgvector, Drizzle ORM, postgres.js.

## Schema overview

- **Better Auth tables** (`users`, `sessions`, `accounts`, `verifications`,
  `organizations`, `organization_members`, `organization_invitations`):
  owned by Better Auth; plural snake_case; NOT under tenant RLS.
- **`audit_logs`**: tenant-scoped; `organization_id` + RLS policy — the
  reference example for new tenant tables.

## Roles

- `crm` (POSTGRES_USER): owner/superuser-ish; migrations + grants;
  `DATABASE_ADMIN_URL`.
- `crm_app`: app runtime role (`NOSUPERUSER NOBYPASSRLS`); `DATABASE_URL`.
  Created by `docker/postgres/init/01-app-role.sh`.

## Migration workflow

```
edit packages/db/src/schema/* → pnpm db:generate → review SQL → pnpm db:migrate
```

- Never edit applied migrations; new changes are new migrations.
- RLS policies, `FORCE ROW LEVEL SECURITY`, grants and default privileges
  for `crm_app` are written as custom migration SQL (see `0002`).

## RLS checklist (new tenant table)

1. `organization_id` column (uuid, not null, references organizations).
2. `pgPolicy` using `current_setting('app.organization_id', true)` and
   `app.platform_scope = 'on'` bypass, plus `.enableRLS()`.
3. Migration grants (SELECT/INSERT/UPDATE/DELETE) to `crm_app` and default
   privileges for future tables.
4. Integration test proving org A can't see org B's rows.

## pgvector plan

`vector` extension is already enabled. Future embedding tables MUST include
`organization_id` and the same RLS policy (embeddings are tenant data).
HNSW index (`vector_cosine_ops`) once a table has real rows — indexes on
empty tables aren't worth planning around yet.
