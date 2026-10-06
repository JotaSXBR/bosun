# AGENTS.md

Guidance for AI agents and contributors working on this repo.

## What this is

**Bosun** — multi-tenant customer operations platform (SaaS CRM). A
**modular monolith**: one Next.js app + pg-boss background jobs in-process +
shared `@crm/*` packages. pnpm/Turborepo monorepo.
Repo: `github.com/JotaSXBR/bosun` (public, Apache-2.0).

## Working agreement

- **State assumptions before coding.** If a request has multiple plausible
  readings, say which one you picked and why — or ask when it's genuinely
  ambiguous. Don't silently pick an interpretation.
- **Simplest sufficient solution.** Minimum code that solves the problem: no
  speculative features, no abstractions for single-use code, no unrequested
  configurability.
- **Surgical diffs.** Touch only what the change requires and match the
  surrounding style. Don't refactor, reformat, or "improve" adjacent code that
  wasn't part of the task.
- **Goal-driven execution.** Turn the task into verifiable goals: reproduce
  the problem → fix → verify. Before finishing, run `pnpm typecheck` and
  `pnpm lint` (plus the relevant tests) and report what you ran.
- **Delegate mechanical work.** When the environment supports it, fan out
  multi-file mechanical edits and exploration to subagents; keep planning and
  review in the main session.

## Architecture & layering

```
UI (React) → Server Action / Route Handler → @crm/core service → repository → Postgres
```

- `apps/web` — Next.js 16 app (UI, Server Actions, API routes, auth handler).
- `packages/core` — domain modules (organizations, audit). No provider SDKs.
- `packages/db` — Drizzle schema, client, `withTenant`/`withPlatformScope`.
- `packages/auth` — Better Auth composition (organization + admin plugins).
- `packages/permissions` — role/permission matrix (single source of truth).
- `packages/config` — Zod-parsed env (`getServerEnv`, `isConfigured`).
- `packages/observability` — JSON logger + `captureException` facade.
- `packages/channels|billing|storage|email|ai` — provider abstractions;
  provider-specific code lives only in `src/adapters/*`.
- `packages/automation` — pg-boss tasks + enqueue helpers (in-process, ADR 0016).
- `packages/ui` — shadcn components.
- `tooling/*` — shared tsconfig/eslint/prettier.
- `research/` — external reference material (e.g. vibe-coding-toolkit),
  gitignored; read for ideas, never edit or import from it.

Dependency direction: app → core/providers → db/config/permissions. Never
import an adapter outside its registry factory. The only `switch` on provider
kind is each package's `create*Provider`.

## Development workflow

Lifecycle: `docs/product/*` (spec) → `/brief` (`.task-brief.md` scope
contract) → `/plan` → `/build` → `/test` → `/review` → `/ship`. Skill
pack lives in `.devin/skills/` (addyosmani/agent-skills + project skills).

Hooks (`.devin/hooks.v1.json` → `.devin/hooks/workflow.mjs`): block edits
outside the brief's `## Escopo` globs (docs/markdown always free) and
require the verification gate before a session with edits can stop.
One active brief at a time; expand scope by editing the brief with user
approval. Non-trivial work starts with clarifying questions — never guess
scope-affecting decisions (see `docs/development/workflow.md`).

## Commands

`pnpm install` · `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` ·
`pnpm test` (unit) · `pnpm test:integration` (needs infra) · `pnpm test:e2e`
(playwright) · `pnpm infra:up|down` · `pnpm db:generate|migrate|seed|studio` ·
`pnpm storage:init`. Jobs (pg-boss) start with `pnpm dev` — nothing separate.

`pnpm install` also installs the **lefthook** pre-commit hook (prettier on
staged files) — skipped automatically under `CI=true`.

## Code rules

- Strict TypeScript, **no `any`**, no speculative abstractions.
- Zod-validate every external payload (webhooks, provider responses, action
  inputs).
- Server Actions return `{ ok: true, ... } | { ok: false, error: string }`;
  never throw raw errors to the client.
- Explicit, readable code; imports only via each module's index exports.

## Database & migrations

1. Edit `packages/db/src/schema/*` → `pnpm db:generate` → review SQL →
   `pnpm db:migrate`.
2. Never edit an already-applied migration; RLS policies and grants are done
   via custom migrations (see `packages/db/migrations`).
3. New tenant-owned table checklist: `organization_id` column + `pgPolicy` on
   `app.organization_id` + `.enableRLS()` + migration granting to `crm_app` +
   integration test proving cross-org isolation.

## Security rules (non-negotiable)

- Tenant isolation is application-layer primary + Postgres RLS as
  defense-in-depth. **Never accept `organizationId` from the client** — it
  comes from the session's active organization.
- `withPlatformScope` only after a platform-admin check.
- Webhooks: `verifyWebhook` on the raw body BEFORE parsing. Provider secrets
  live in env only.
- No secrets/PII in logs; logger redacts token/secret/password keys anyway.
- AI agents reach capabilities only through permissioned tools — never a DB
  handle.
- Uploads only via `tenantObjectKey(organizationId, ...)`.
- Errors in domain/packages go through `captureException` — never Sentry
  directly.

## How-tos

- **New domain module**: `packages/core/src/modules/<name>/{index,service,repository,schemas}.ts`,
  export from module index; take `db` + `TenantContext`, assert permissions
  inside the service.
- **New tenant-owned table**: follow the checklist in "Database & migrations"
  and `docs/database/README.md`.
- **Channel webhook ingestion**: `POST /api/webhooks/channels/<webhookToken>`
  resolves the connection under `withServiceAccess` (unguessable token),
  verifies the provider signature on the raw body, then ingests each
  `ChannelEvent` via `@crm/core/messaging` inside `withTenant` and enqueues
  `process-channel-event`. Connection credentials are AES-256-GCM under
  `CHANNEL_CREDENTIALS_KEY` (`@crm/core/crypto`).
- **New ChannelProvider** (e.g. Instagram, Telegram): add
  `packages/channels/src/adapters/<name>.ts` implementing `ChannelProvider`
  (`src/provider.ts`), normalize webhooks into `ChannelEvent`
  (`src/domain.ts`), add the kind to `ChannelProviderKind` and one `case` in
  `createChannelProvider` (`src/registry.ts`). Fixture-based tests for
  signature verification, parsing and outbound requests.
- **New BillingProvider**: `packages/billing/src/adapters/<name>.ts`
  implementing `BillingProvider`; money is integer cents in the domain,
  conversion only inside the adapter; webhook `eventId` is the idempotency
  key; register in `createBillingProvider` (`src/registry.ts`).
- **New AI provider**: add the `@ai-sdk/<provider>` package to `packages/ai`,
  extend `ModelRef["provider"]` and the switch in `resolveLanguageModel`
  (`src/model.ts`), add the API key to `@crm/config`. Agents only reference a
  `ModelRef`; never import a provider SDK elsewhere.
- **New agent tool**: `defineAgentTool({ requiredPermissions, execute(ctx, input) })`
  calling `@crm/core` services; register it and list it in the agent's `tools`.
- **New StorageProvider**: implement `StorageProvider`
  (`packages/storage/src/domain.ts`) next to `S3StorageProvider`; keep keys
  produced by `tenantObjectKey`.
- **New EmailProvider**: `packages/email/src/providers/<name>.ts` +
  one branch in `createEmailProvider` + `EMAIL_PROVIDER` enum in `@crm/config`.
- **New job/task**: `packages/automation/src/tasks/<name>.ts` — a zod
  payload schema + plain async handler; rebuild TenantContext from the DB,
  never trust payload beyond identity; enqueue helper in `src/enqueue.ts`,
  pass `tx` when inside a transaction (`boss.send` via `fromDrizzle` is
  atomic with the write); enqueue must no-op (`{ skipped: true }`) when the
  boss isn't started. Register queue+work(+schedule) in `boss.ts`. Jobs run
  in-process — no worker tier (see `docs/development/jobs-pg-boss.md`).

## Running locally

`pnpm install` → `cp .env.example .env` → `pnpm infra:up` → `pnpm db:migrate`
→ `pnpm db:seed` → `pnpm storage:init` → `pnpm dev` (http://localhost:3000).
Seed logins (`Password123!`): platform admin `superadmin@crm.local`; demo org
`owner@`, `admin@`, `manager@`, `agent@crm.local`.
External integrations are optional; the app boots with only the required env.

## Further reading

`docs/architecture/` (overview, multi-tenancy, providers, realtime,
observability, security, stack), `docs/adr/`, `docs/domains/`,
`docs/database/`, `docs/development/` (incl. `cicd.md` —
GitHub Actions → GHCR → Coolify pipeline).

## Testing

Unit: `*.test.ts` (vitest, no infra). Integration: `*.int.test.ts` (real
Postgres/RustFS). E2E: `apps/web/e2e/*.spec.ts` (playwright). Fake providers
live in each package's `testing` export.

## Definition of done

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` green, plus
relevant integration tests for anything touching DB/providers.

## Do NOT

- No `apps/worker` without an ADR (see docs/adr/0010).
- No new infrastructure services or dependencies without justification.
- No Terraform/Kubernetes (yet). No microservices, extra queues or extra
  databases — ask "what concrete problem does this solve now?" first.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).

## Tooling (integrations)

- **GitHub**: prefer the `github-mcp-server` MCP tools. For pull-request
  operations, if the MCP call fails on the first attempt, fall back to the
  `gh` CLI.
- **Coolify**: only via the `coolify` MCP tools — never raw REST/curl to
  the panel (real host in `docs/development/deployment.local.md`). The MCP
  is read + deploy + start/stop/restart; for
  config writes it doesn't expose (envs, fqdn, healthcheck), escalate to the
  user instead of bypassing.
