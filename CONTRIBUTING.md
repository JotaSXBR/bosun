# Contributing to Bosun

Thanks for your interest! This document explains how to get changes merged.

## Ground rules

- **Start with an issue** for anything beyond a typo fix — describe what you
  want to change and why, and wait for maintainer feedback before writing
  lots of code.
- Read `AGENTS.md` — it documents the architecture, layering rules, and code
  conventions that apply to humans and agents alike.
- Contributions are licensed under the Apache-2.0 license (see `LICENSE`).
- Follow the `CODE_OF_CONDUCT.md`.

## Development setup

```bash
pnpm install
cp .env.example .env
pnpm infra:up          # Postgres + RustFS via docker compose
pnpm db:migrate && pnpm db:seed && pnpm storage:init
pnpm dev               # http://localhost:3000
```

## Pull request workflow

1. Fork the repo and branch from `main`.
2. Keep the change small and focused — one concern per PR.
3. Follow Conventional Commits (`feat:`, `fix:`, `chore:`...).
4. Before pushing, run the gate:
   ```bash
   pnpm format:check && pnpm typecheck && pnpm lint && pnpm test
   ```
   Add integration tests (`*.int.test.ts`) when touching DB/providers, and an
   e2e spec for user-facing flows.
5. PRs merge via squash; delete the branch afterwards.

## What CI checks

`quality` (format + lint + typecheck + unit + build), `integration`
(Postgres + RustFS + Playwright e2e), and `scan` (Trivy fs). A maintainer
will approve the CI run for first-time contributors — this is normal.

## Code rules (the short version)

- Strict TypeScript — no `any`.
- Zod-validate external payloads.
- Never accept `organizationId` from the client — it comes from the session.
- Domain logic lives in `@crm/core` services; UI stays thin.
- Provider SDKs only inside `packages/*/src/adapters/`.
- Server Actions return `{ ok: true, ... } | { ok: false, error }`.
