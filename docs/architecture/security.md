# Security

## Authentication

Better Auth 1.7 (email+password, organization and admin plugins).
`requireEmailVerification` in production; trusted origins = `APP_URL` only;
sessions are cookie-based via `nextCookies`.

## Authorization

Org roles (`owner`/`admin`/`manager`/`agent`) are defined once in
`@crm/permissions` and consumed by both Better Auth and application checks
(`assertPermission(ctx, ...)`, `hasPermission`). `platform_admin` is an admin
plugin role for platform operations.

## Tenant isolation

See `multi-tenancy.md`: TenantContext from the session (never client input),
app-layer filtering, RLS on tenant tables via `crm_app` role +
`withTenant` transactions.

## Secrets

Only via env vars parsed by `@crm/config`; `.env` is gitignored; logger
redaction is a backstop, not a license to log secrets.

## Webhooks

Every provider webhook is verified on the **raw body** before parsing:
WAHA HMAC-SHA512, Meta `x-hub-signature-256` SHA-256 (timing-safe compare),
Asaas `asaas-access-token`. Unconfigured verifiers reject — an endpoint can
never silently accept unsigned events.

## Rate limiting

Better Auth in-memory rate limiter (per-instance) today; move to Redis as
secondary storage when we run multiple instances.

## CSRF

Next.js Server Actions perform origin checks; Better Auth enforces
`trustedOrigins` on its routes.

## XSS

React escaping everywhere; no `dangerouslySetInnerHTML`. A strict CSP header
is the next hardening step.

## SQL injection

Drizzle parameterizes all queries; raw SQL appears only in migrations.

## Uploads

Tenant files only via `tenantObjectKey(organizationId, ...)` →
`org/<uuid>/...`; the helper rejects traversal (`..`, backslashes, leading
`/`). Signed URLs are short-lived, per-method.

## AI tools

Agents call only registry tools filtered by `hasPermission`; no DB handle is
ever passed to a tool — they go through `@crm/core` services.

## Job isolation

Trigger payloads carry identity only; tasks rebuild TenantContext from the
membership table before acting.

## Logs

JSON logs to stdout; secret-like keys are deep-redacted. Errors flow through
`captureException` → Sentry/GlitchTip when configured.
