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

React escaping everywhere; no `dangerouslySetInnerHTML`. A nonce-based CSP
(see below) is the second layer.

## Content Security Policy

`apps/web/src/proxy.ts` sets a per-request nonce CSP on every document
response (`config.matcher` skips `api/*`, `_next/static`, `_next/image`,
`favicon.ico`, files with an extension, and prefetch/RSC requests).

Policy (production; whitespace-collapsed single line):

    default-src 'self'; script-src 'self' 'nonce-N' 'strict-dynamic';
    style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:;
    font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';
    form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests

Rationale:

- `script-src` trusts same origin plus the request nonce; `'strict-dynamic'`
  lets those trusted scripts load their own chunks, so no per-bundle
  allowlist is needed. Inline handlers and injected scripts stay blocked.
- `style-src` keeps `'unsafe-inline'` (deviates from the docs' nonce-based
  styles) because React `style` attributes can't carry a nonce.
- `img-src https:` permits remote images (avatars, channel media) over TLS.
- `connect-src 'self'` covers Server Actions/fetch; Sentry is server-side
  only, so no reporting origin is needed.
- `frame-ancestors 'none'` is the CSP twin of `X-Frame-Options: DENY`;
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` close the
  usual gadget vectors.

Nonce flow: the proxy generates `Buffer.from(crypto.randomUUID()).toString('base64')`,
writes `x-nonce` + `Content-Security-Policy` onto the **request** headers and
forwards them via `NextResponse.next({ request: { headers } })`. During SSR,
Next parses the nonce back out of that request CSP header and stamps it on
framework and inline script tags automatically. The proxy also sets the CSP
on the **response** headers, so redirects carry it too. Because the nonce only
exists at request time, all pages must render dynamically — hence
`export const dynamic = "force-dynamic"` in the root layout.

Dev relaxations (none apply to prod): `'unsafe-eval'` in `script-src` (React
dev error stacks), `ws: wss:` in `connect-src` (HMR websocket), and no
`upgrade-insecure-requests` (would force localhost http/ws to TLS).

To allow a new source later: add the origin to the matching directive in the
`cspHeader` template in `proxy.ts` (e.g. a CDN in `img-src`, a third-party
script host in `script-src`). Prefer `next/script` (it picks up the nonce
automatically) over widening `script-src`, and never add `'unsafe-inline'`
to `script-src` — it would void the nonce model.

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
