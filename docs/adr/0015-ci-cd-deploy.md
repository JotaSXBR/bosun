# 0015: CI/CD — GitHub Actions, GHCR, Coolify pull-deploy, tag-gated prod

Status: accepted

## Context

Repo went private on GitHub (`JotaSXBR/bosun`) with a self-hosted Coolify
VPS (4 CPU / 10 GB). Constraints: the server must never build (limited
RAM), staging + prod share the machine, and the founder asked for
explicit CI (install→lint→test→build→scan) and CD
(image→staging→approve→prod) stages.

## Decision

- **Build once in CI, deploy an image.** Root `Dockerfile` produces a
  non-root `node:24-alpine` image (Next standalone + isolated migrator
  bundle). Published to GHCR as `ghcr.io/jotasxbr/bosun` via the automatic
  `GITHUB_TOKEN` (`packages: write`).
- **Scan = Trivy, twice.** Filesystem scan (deps + secrets) as the last CI
  gate; image scan after push in CD, before deploy. Chosen over CodeQL /
  GitHub secret scanning because those need Advanced Security on private
  repos.
- **Coolify "Docker Image" apps pull mutable tags.** `:staging` on every
  main push; `:prod` only on `v*.*.*` tag — **the release tag is the
  approval gate** (works on the free plan; GitHub Environment required
  reviewers need Pro on private repos).
- **Deploy = authenticated webhook.** `POST /api/v1/deploy?uuid=…` with a
  deploy-scoped Coolify API token in GitHub secrets. No SSH, no agent on
  the runner.
- **Migrations in the container entrypoint** (`docker/web/migrate.mjs`,
  `DATABASE_ADMIN_URL ?? DATABASE_URL`) — idempotent, runs before the
  server accepts traffic.
- **Rollback = retag, not rebuild.** `workflow_dispatch` job rewrites
  `:prod` to an older manifest (`imagetools create`) and re-fires the
  webhook.

## Consequences

- VPS stays a dumb runtime — 10 GB RAM is never spent compiling.
- Staging deploys are automatic on every green main; prod moves only when
  a human cuts a tag. Traceable: every image carries `sha-*` (+`v*`).
- A failed Trivy scan can leave an undeployed vulnerable image in GHCR —
  harmless, but visible. Branch protection is unenforced until the plan
  upgrades (documented in `docs/development/cicd.md`).
- Migrating inside the entrypoint trades a pre-deploy step for simplicity;
  acceptable at single-replica scale — revisit when replicas > 1.
- `docker/web/migrator/` pins `drizzle-orm`+`postgres` outside the
  workspace — must be bumped in sync with `packages/db`.

## Alternatives considered

- **SSH + docker compose pull on the VPS** — needs SSH keys in CI and an
  open port; the webhook needs neither.
- **Watchtower / Coolify polling** — deploy latency + invisible trigger;
  the webhook makes deploys explicit events in the Actions log.
- **Build inside Coolify** — violates the RAM constraint and doubles the
  toolchain to maintain.
- **GitHub Environments with required reviewers** — gated behind a paid
  plan for private repos; tags give the same human-in-the-loop free.
- **Dokploy/CapRover/Kamal** — Coolify is already running.
