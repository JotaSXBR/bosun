# 0005: Authentication — Better Auth

Status: accepted

## Context

We need email/password auth, organizations with roles, sessions, rate
limiting and a clean Drizzle integration — without building it ourselves.

## Decision

Better Auth 1.7 with the `organization` plugin (org membership + our
`@crm/permissions` matrix as `ac`/`roles`), `admin` plugin (`platform_admin`
role), `nextCookies` for Next integration, Drizzle adapter on the
`packages/db` schema. Email verification/reset flows through `@crm/email`.

## Consequences

- Org lifecycle/membership APIs are provided; we compose, not reimplement.
- Better Auth tables are deliberately NOT under tenant RLS (see ADR-0004).
- Rate limiting is in-memory until multi-instance forces Redis storage.

## Alternatives considered

- Clerk/Auth0: per-tenant org model mismatch and SaaS cost — rejected.
- Roll our own: session/CSRF/reset surface is large — rejected.
