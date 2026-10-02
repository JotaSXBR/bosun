# Multi-tenancy

Hierarchy: **Platform → Organization → Users (members) → Resources**.

A user may belong to many organizations (Better Auth `organization` plugin).
The **active organization** is stored on the session
(`setActiveOrganization`); every request resolves it into a `TenantContext`:

```ts
{
  (organizationId, userId, role, isPlatformAdmin);
}
```

built in `apps/web/src/server/tenant.ts` and passed down through services —
services never read the session or accept a raw `organizationId` from the
client.

## Two layers of isolation

1. **Application layer (primary).** Services require a `TenantContext` and
   assert permissions (`assertPermission`); repositories always filter by
   `organizationId`.
2. **Postgres RLS (defense-in-depth).** Tenant tables carry a policy on
   `app.organization_id`. The app connects as the restricted role `crm_app`
   (`NOBYPASSRLS`); `withTenant(db, orgId, fn)` opens a transaction and
   `SET LOCAL`s the tenant, so a buggy query without a `WHERE` still can't
   cross tenants.

**Why RLS on tenant tables:** audit logs and future CRM/messaging rows must be
physically unreachable across orgs even if application code is wrong.
**Why NOT on Better Auth tables:** users/sessions/memberships are shared by
design — Better Auth manages cross-org membership lookup itself and must see
all rows; scoping them would break sign-in and org switching.

**Roles:** `crm` (owner, migrations/grants, bypasses RLS) vs `crm_app`
(application, restricted — created in `docker/postgres/init`).

## Platform scope

`withPlatformScope` sets `app.platform_scope=on`, which tenant policies treat
as full access. Use only after verifying `isPlatformAdmin` (platform admin
operations, Trigger job bootstrapping that must read membership across orgs).

## Trigger jobs

Job payloads carry only **identity** (`organizationId`, `actorUserId`). The
task re-reads membership under platform scope, rebuilds the `TenantContext`,
then runs withTenant-backed services — a forged payload can never escalate.

## Pitfalls

- `SET LOCAL` works only inside a transaction — `withTenant`/`withPlatformScope`
  always open one; do not `set_config` outside `db.transaction`.
- Connection pooling is safe because the setting is transaction-scoped, but a
  leaked `SET` (session-level) would poison the pool — never use `SET` without
  `LOCAL`.
