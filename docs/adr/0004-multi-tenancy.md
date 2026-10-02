# 0004: Multi-tenancy model

Status: accepted

## Context

Shared-database tenancy vs schema/db-per-tenant; how much to trust
application code vs the database.

## Decision

Shared database, shared schema. Isolation is **application-layer primary**
(TenantContext + permission checks) with **Postgres RLS as
defense-in-depth** on tenant tables (`app.organization_id` policy via
`withTenant`). Better Auth tables stay unscoped — membership must cross orgs.
Platform operations use `withPlatformScope` behind an `isPlatformAdmin`
check. See `docs/architecture/multi-tenancy.md`.

## Consequences

- Every tenant table needs `organization_id` + policy + grants + a
  cross-tenant test — enforced by a checklist.
- A missing `WHERE` still can't leak rows (RLS).
- Session-level `SET` would poison the pool — only `SET LOCAL` inside
  transactions is allowed.

## Alternatives considered

- Schema-per-tenant: migration/connection explosion at scale — rejected.
- App-layer only: one bug leaks data — rejected.
