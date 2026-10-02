# 0001: Monorepo (pnpm + Turborepo)

Status: accepted

## Context

App, domain modules, provider adapters and shared tooling evolve together and
must share types (e.g. `TenantContext`, provider domain models) with zero
publish overhead.

## Decision

pnpm workspaces + Turborepo. Internal `@crm/*` packages are just-in-time —
they export TypeScript sources, not built artifacts; Next transpiles them
(`transpilePackages`).

## Consequences

- Single `pnpm install` / lockfile; atomic refactors across packages.
- No build step for libraries — but they can't be published, which is fine.
- Turbo pipelines gate CI (`lint typecheck test build`).

## Alternatives considered

- Polyrepo: type drift, publishing overhead — rejected.
- Single package with folders: no enforceable boundaries — rejected.
