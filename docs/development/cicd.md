# CI/CD — GitHub Actions → GHCR → Coolify

The server never builds anything. GitHub builds, scans and publishes the
image; Coolify only pulls and runs it. Repo: `github.com/JotaSXBR/bosun`
(private).

## Pipeline overview

```
CI (.github/workflows/ci.yml)         push to main / every PR
┌──────────┐   ┌─────────────┐   ┌──────┐
│ quality  │──→│ integration │   │ scan │
└──────────┘   └─────────────┘   └──────┘
 install        postgres+rustfs    trivy fs:
 format:check   db:migrate+seed    vuln+secret
 lint           integration tests  HIGH/CRIT
 typecheck      playwright e2e     blocks on fixable
 unit test
 build

CD (.github/workflows/cd.yml)
push main ──→ image ──→ scan ──→ deploy-staging ──→ Coolify pulls :staging
tag v*.*.* ─→ image ──→ scan ──→ deploy-prod    ──→ Coolify pulls :prod
dispatch  ─────────────────────→ rollback       ──→ retag :prod, redeploy
```

## CI stages

| Stage                   | Job           | What runs                                                                                                   |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| INSTALL+LINT+TEST+BUILD | `quality`     | `pnpm install --frozen-lockfile`, `format:check`, `turbo lint typecheck test build`                         |
| TEST (integration)      | `integration` | Postgres 18 + RustFS services, `db:migrate`, `db:seed`, `test:integration`, Playwright e2e                  |
| SCAN                    | `scan`        | Trivy filesystem scan: dependency vulns (`pnpm-lock`) + committed secrets, HIGH+CRITICAL with fix available |

`integration` and `scan` both `needs: quality` — tests/scan only run when
install+lint+unit+build are green.

**Why Trivy and not CodeQL/secret scanning:** GitHub's native scanners
require GitHub Advanced Security on private repos. Trivy covers dependency
vulns + secrets in one pass, free. Image scanning uses the same tool in CD
for consistency. Revisit if the repo ever goes public or the plan upgrades.

Trivy runs via the official `aquasec/trivy:0.65.0` **container image** (not
`trivy-action`) — the action's bundled binary installer failed
deterministically on GitHub runners; the container path has zero install
surface and pins the scanner version by tag.

Dependency hygiene is proactive via **Dependabot** (`.github/dependabot.yml`):
weekly PRs for npm (pnpm workspace), github-actions and docker base-image
updates; dev-deps minor/patch grouped into a single PR.

## CD stages

| Stage   | Trigger                | What happens                                                     |
| ------- | ---------------------- | ---------------------------------------------------------------- |
| IMAGE   | push `main` / tag `v*` | docker build → push `ghcr.io/jotasxbr/bosun` → Trivy image scan  |
| STAGING | push `main`            | Coolify webhook → staging app pulls `:staging`                   |
| APPROVE | `git tag v*.*.*`       | the tag IS the approval — prod only moves on an explicit release |
| PROD    | tag push               | Coolify webhook → production app pulls `:prod`                   |

Image tags pushed per event:

| Event        | Tags                           |
| ------------ | ------------------------------ |
| push `main`  | `sha-<short>`, `staging`       |
| tag `v1.2.3` | `sha-<short>`, `1.2.3`, `prod` |

`:staging`/`:prod` are mutable pointers Coolify tracks; `sha-*`/`v*` are
immutable references for traceability and rollback.

## The image (`Dockerfile`, repo root)

Multi-stage, `node:24-alpine`, non-root (`bosun` user):

1. **build** — `pnpm fetch` (lockfile-only layer) → `install --offline` →
   `pnpm --filter @crm/web build` (Next standalone output).
2. **migrator** — isolated `npm ci` of just `drizzle-orm` + `postgres`
   (`docker/web/migrator/`). The standalone trace excludes the migrator
   module and drizzle-kit is dev-only, so migrations get their own runtime.
3. **runner** — standalone output + `static` + `public` + `/migrate`
   (migrations + script) + `entrypoint.sh`.

`entrypoint.sh` runs `node /migrate/migrate.mjs` (idempotent, uses
`DATABASE_ADMIN_URL ?? DATABASE_URL`) then execs `apps/web/server.js`.
Health: Docker HEALTHCHECK + route `GET /api/health` (200/503 with DB ping).
Skip migrations with `SKIP_DB_MIGRATE=true` (debug shells only).

## GitHub secrets (repo → Settings → Secrets → Actions)

| Secret                       | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| `COOLIFY_TOKEN`              | Coolify API token, **deploy** permission only      |
| `COOLIFY_WEBHOOK_STAGING`    | staging app's _Deploy Webhook (auth required)_ URL |
| `COOLIFY_WEBHOOK_PRODUCTION` | production app's webhook URL                       |

`GITHUB_TOKEN` (automatic) pushes to GHCR — `packages: write` is granted in
the workflow, nothing to configure.

Until the Coolify secrets exist, deploy steps **warn and skip** (`::warning`
in the run log) instead of failing every push — so an unfinished setup never
turns CI red.

## Release flow

```bash
git tag -a v0.1.0 -m "Release 0.1.0"
git push origin v0.1.0     # → image :prod + :0.1.0 → prod deploy
```

## Rollback

Actions → **CD** → Run workflow → `rollback_ref` = `v1.2.2` or `sha-abc1234`
→ retags `:prod` to that manifest (no rebuild) and fires the prod webhook.
To check available refs: package page `ghcr.io/jotasxbr/bosun` → tags.

## Branching model — trunk-based, no staging branch

Decided 2026-10-05: **no `staging`/`develop` branch** (rejected Git-Flow).

- `main` is the single long-lived branch; features ship via short-lived
  branches + squash-merged PRs (`delete_branch_on_merge` is on).
- Environment separation is done by **deploy targets, not branches**:
  push to `main` deploys staging; tag `v*.*.*` deploys production. A
  `staging` branch would duplicate what the `:staging` image tag already
  does and force a second merge hop for zero extra safety.
- Repo merge settings: squash-only (merge commit and rebase disabled),
  `allow_update_branch` on. `allow_auto_merge` is off — GitHub requires
  required status checks for it, which need Pro.

## Branch protection — plan limitation

Required status checks on a **private** repo need GitHub Pro. The workflow
was attempted via API and returned 403. Options:

- **GitHub Pro** (~$4/mo): then apply via Settings → Branches → add rule →
  require `quality`, `integration`, `scan` checks + block force-push.
- Keep free: CI still runs on every push/PR — protection is cultural until
  the plan upgrades. Solo dev can also protect main by simply not pushing
  broken code (CI catches it anyway).

## Coolify-side setup

See `docs/development/deployment-coolify.md` — creating the two Docker
Image apps, GHCR registry auth (PAT `read:packages`), env vars, DB
bootstrap and webhook URLs.
