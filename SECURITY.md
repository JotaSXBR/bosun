# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security reports.

Use **GitHub private vulnerability reporting**: open the repository's
_Security_ tab → _Report a vulnerability_. Your report is visible only to the
maintainers until a fix is released.

Please include: affected component, reproduction steps or proof of concept,
and the potential impact. We aim to acknowledge reports within 72 hours and
to keep you updated on remediation progress.

## Scope

In scope: the application code in this repository (`apps/web`,
`packages/*`), including authentication, tenant isolation (RLS), webhooks,
and provider integrations.

Out of scope: issues in third-party dependencies (report to the upstream
project — or mention them if they create a concrete vulnerability here),
social engineering, and attacks requiring physical access.

## Supported versions

Security fixes are applied to `main` and shipped in the next release tag.
Only the latest release line is supported.

## Practices worth knowing

- Secrets and credentials are never stored in this repository — provider
  keys come from environment variables at runtime.
- Tenant isolation is enforced at the application layer and backed by
  Postgres row-level security.
- Webhook payloads are signature-verified on the raw body before parsing.
- The CI pipeline runs Trivy scans (filesystem + container image) on every
  merge.
