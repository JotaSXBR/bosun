# 0013: Engineering tooling reference (vibe-coding-toolkit)

Status: accepted

## Context

The repo bootstrapped with a minimal quality gate (ESLint flat config +
Prettier + tsc). The local reference checkout `research/vibe-coding-toolkit`
(MIT, soumatheusgomes/vibe-coding-toolkit) describes a more deliberate setup —
curated rules over presets, warn→error promotion, architecture boundaries,
type-aware lint split, agent working agreement. This ADR records what we
adopted, what we rejected, and why, after measuring every candidate rule
against this codebase.

## References

- `research/vibe-coding-toolkit/templates/eslint/eslint.config.mjs.example` —
  fast-tier flat config (curated rules, import-x zones, local `quality/*`
  plugin, size/complexity warn tier).
- `research/vibe-coding-toolkit/templates/eslint/eslint.typed.config.mjs.example` —
  separate type-aware config (`lint` vs `lint:types`).
- `research/vibe-coding-toolkit/docs/tools/06-eslint-biome-quality-gates.md` —
  two-liner philosophy, warn→error promotion, dual-severity boundaries.
- `research/vibe-coding-toolkit/templates/CLAUDE.md.template` — behavioral
  guidelines adapted into AGENTS.md "Working agreement".
- `research/vibe-coding-toolkit/docs/tools/02-subagent-orchestration.md` —
  specialist routing table pattern.
- `research/vibe-coding-toolkit/docs/tools/12-context7.md` — "verify docs for
  the installed version before writing" principle; applied here by reading
  rule names/options directly in `node_modules` of the pinned versions
  (equivalent guarantee, no extra tooling).
- npm registry findings: `eslint-plugin-security@4.2.0`,
  `eslint-plugin-drizzle@0.2.3` (option `drizzleObjectName` verified in rule
  source), `@vitest/eslint-plugin@1.6.27`, `eslint-plugin-playwright@2.12.0`
  (`no-focused-test` singular), `globals@17.13.0`.
- Issue tracked: `typescript-eslint#10940` — TS 7 (native/Go) support; the
  lint toolchain API only lands in TS 7.1.

## Current CRM setup (before)

- pnpm 12 + Turbo monorepo; every package runs `eslint .` via shared
  `tooling/eslint` (`base.js`, `next.js`).
- `recommendedTypeChecked` + `projectService` already on for every package —
  one lint tier, no split.
- Rules: `consistent-type-imports`, `no-explicit-any`, `no-floating-promises`,
  `simple-import-sort`, Next core-web-vitals in apps/web.
- Prettier via `@crm/prettier-config`; no `.prettierignore` (only defaults).
- TS 6.0.3 strict + `noUncheckedIndexedAccess`; no `verbatimModuleSyntax`.
- CI runs `turbo run lint typecheck test build` — no format gate.
- No editor settings committed; no TODO.md; AGENTS.md had no working
  agreement.

## Reference project setup

The toolkit reference (per its templates/docs): ESLint **fast tier** with a
curated rule set (not full presets) + a separate **type-aware tier**
(`eslint.typed.config.mjs`, run as `lint:types` in CI/manual only) + a local
`eslint-rules/` plugin (`quality/max-lines`, `quality/no-direct-console`,
`quality/no-direct-data-access`) + `eslint-plugin-import-x` boundary zones
registered twice under aliased plugin keys (error for new debt, warn for
legacy). Optionally Biome for a curated fast pass; formatter explicitly
decided per-codebase-age; pre-commit hook runs the fast tier. Agent guidance
lives in a `CLAUDE.md` with a specialist routing table; Claude Code
hooks/settings and a MEMORY.md pattern automate parts of the loop.

## Research findings

Measured during implementation (full `turbo run lint --force --continue`):

- `no-duplicate-imports`: **40 violations**, all `import type` + `import`
  pairs — the codebase's deliberate style, enforced by
  `consistent-type-imports`. Resolved by enabling the rule with
  `allowSeparateTypeImports: true` (ESLint 9.39 option): still catches
  same-kind duplicates, zero churn.
- `complexity` (12): 4 warnings — `isConfigured` 23, `metaContent` 20,
  two `parseWebhook` 15/21.
- `max-statements` (20): 3 warnings — `createOrganization` 26,
  `parseWebhook` 23, seed `main` 22.
- `prefer-nullish-coalescing`: 1 warning (`packages/db/src/client.ts`).
- `no-unnecessary-condition`: 4 warnings (ui ×2, storage ×2).
- `prefer-optional-chain`, `no-unnecessary-type-assertion`,
  `restrict-template-expressions` (allowNumber): **0 violations** each →
  adopted at error.
- `security/*` (4 rules), `drizzle/*` (2 rules), `no-console`, `no-var`,
  `prefer-const`, `no-empty`, `eqeqeq`, `max-lines` (350 error), `vitest/*`,
  `playwright/*`: **0 violations** each.
- `verbatimModuleSyntax`: **0 typecheck violations** → adopted.
- `erasableSyntaxOnly`: 7 `TS1294` sites (constructor parameter properties)
  across 7 files — over the >3-file restructuring budget → **reverted**,
  tracked in TODO (the expansion is mechanical and can be done later).
- `**/e2e/**` as a base ignore would have made the web playwright block dead
  config — flat-config ignores are global and cannot be re-enabled. e2e stays
  lintable; the base test globs never matched `*.spec.ts` anyway.

## Comparison

| Área                   | CRM atual                                      | Referência                                         | Pesquisa                                                                | Decisão                                        | Motivo                                                                         |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Linter(s)              | ESLint 9 flat, `recommendedTypeChecked`        | ESLint curated + optional Biome pass               | One type-aware linter already covers everything we need                 | ESLint only                                    | Second linter = overlap + config surface, no measured gain                     |
| Formatter              | Prettier (`@crm/prettier-config`)              | Biome formatter for new codebases / off for legacy | Prettier already adopted repo-wide                                      | Prettier + `.prettierignore`                   | Consistent with existing setup; ignore file was the missing piece              |
| Typed lint tier        | Single tier, `projectService` always on        | Split `lint` + `lint:types`                        | Full lint ~25s uncached, far under pain threshold                       | Keep single tier                               | Split only pays when lint >~30s (P3 TODO)                                      |
| Custom rules           | None                                           | Local `quality/*` plugin                           | Core rules cover console/file-size/boundary needs                       | No custom plugin                               | Owning rule code must beat existing coverage — it doesn't                      |
| Import boundaries      | `no-restricted-imports` inside `packages/core` | `import-x/no-restricted-paths` error+warn zones    | Same core rule covers UI→db/auth too                                    | `no-restricted-imports` everywhere             | No resolver/zones machinery needed for two simple boundaries                   |
| File-size budget       | None                                           | `quality/max-lines` error                          | Largest source file: 320 lines                                          | `max-lines` 350 error                          | Hard stop above largest file; test files get warn variant                      |
| Complexity rules       | None                                           | Warn tier in fast config                           | 7 total warnings (complexity 4, max-statements 3)                       | Same warn tier                                 | All counts under the <~15 adoption bar                                         |
| Security rules         | None                                           | Not covered by reference                           | `eslint-plugin-security@4.2.0` flat-compatible                          | 2 error + 2 warn, no `detect-object-injection` | Real-bug rules at error; heuristic rules at warn                               |
| Test plugins           | None                                           | Not covered by reference                           | `@vitest/eslint-plugin` + `eslint-plugin-playwright` exist for ESLint 9 | vitest block + playwright block                | `no-focused-tests`/`no-focused-test` at error are always bugs                  |
| Git hooks              | None                                           | Pre-commit fast-lint hook                          | Agent-run checks (`lint`/`typecheck` before finishing) suffice          | No hooks                                       | Hook value is for human contributors; agents run gates explicitly (P3 revisit) |
| Agent memory           | AGENTS.md + CLAUDE.md import                   | CLAUDE.md + MEMORY.md + tool settings              | AGENTS.md is already the cross-tool source of truth                     | Working agreement section in AGENTS.md         | Durable content ported; tool-specific machinery skipped                        |
| Subagent orchestration | Not documented                                 | ~20-specialist routing table                       | This environment already dispatches subagents                           | One line in working agreement                  | Full roster is Claude-Code-specific; delegation principle is what matters      |
| Supply-chain           | `minimumReleaseAgeExclude` list only           | Explicit `minimumReleaseAge`                       | pnpm 12's built-in default is already 1440 min                          | Leave default, no explicit value               | Pinning the default adds maintenance, zero protection                          |
| Node version           | 24                                             | —                                                  | Node 26 goes LTS 2026-10-28                                             | Stay on 24, P1 migration TODO                  | Track after LTS + toolchain validation                                         |
| TS version             | 6.0.3                                          | —                                                  | TS 7 lacks lint-plugin API until 7.1; tseslint requires <6.1            | Stay on 6.0.3 + `verbatimModuleSyntax`         | `erasableSyntaxOnly` deferred (7 param-property sites > 3-file budget)         |

## Decision

Adopt the toolkit's _philosophy_ — curated severity policy, warn→error
promotion, size/complexity budget, boundary enforcement via core rules —
while keeping our single-type-aware-tier ESLint and rejecting the pieces that
don't pay their way here (custom plugin, import-x, Biome, hooks, split
tiers). Concretely:

- `tooling/eslint/base.js`: new ignores (`*.tsbuildinfo`, playwright-report,
  test-results), `globals.node` for JS config files, error tier
  (`no-var`, `prefer-const`, `no-empty`, `no-duplicate-imports`
  w/ `allowSeparateTypeImports`, `eqeqeq` null-ignore), `no-console` error on
  all TS with ordered exemption blocks, `eslint-plugin-security` (2 error +
  2 warn, `detect-object-injection` intentionally off), `eslint-plugin-drizzle`
  (`drizzleObjectName: ["db","tx"]`), size/complexity warn tier,
  `max-lines` 350 as error, vitest block on test globs, promoted
  strictTypeChecked rules per measured counts.
- `tooling/eslint/playwright.js`: new export with the e2e block; spread in
  `apps/web/eslint.config.js` together with the UI boundary
  `no-restricted-imports` (`src/**/*.tsx`, `src/components/**/*.ts` may not
  import `@crm/db`, `drizzle-orm`, `@crm/auth`).
- `apps/web/src/server/services.ts`: composition helpers binding `getDb`
  (`listRecentAuditEvents`, `listMyOrganizations`) so `app/app/page.tsx` no
  longer touches `@crm/db`.
- `packages/auth/src/auth.ts`: `console.log` → `createLogger` from
  `@crm/observability` (new dep); `packages/observability` opts out of
  `no-console` in its own config (it _is_ the logger).
- Root `.prettierignore`; `pnpm format:check` step in CI;
  `.vscode/settings.json` + `extensions.json`; `verbatimModuleSyntax` on;
  `minimumReleaseAge` left at the built-in default (1440 min) — see below.
- `AGENTS.md` gained a tool-agnostic "Working agreement"; new `TODO.md`;
  new `docs/development/tooling.md`.

## Adopted practices

| Practice                   | Detail                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Curated rules over presets | Every added rule has a stated reason; violation counts measured before choosing severity.                                                                                          |
| Warn→error promotion       | Warn-tier rules get promoted once their count reaches zero; workflow documented in `docs/development/tooling.md`.                                                                  |
| Size/complexity budget     | `complexity` 12, `max-depth` 4, `max-params` 4, `max-statements` 20, `max-nested-callbacks` 3, `max-lines-per-function` 150 (warn); `max-lines` 350 (error — largest file is 320). |
| Boundary enforcement       | `no-restricted-imports` for UI→db/auth in apps/web; existing core module rule kept.                                                                                                |
| Security lint              | `security/detect-eval-with-expression` + `detect-pseudoRandomBytes` error; `detect-unsafe-regex` + `detect-child-process` warn.                                                    |
| Drizzle foot-guns          | delete/update without `.where()` is an error on `db`/`tx` handles.                                                                                                                 |
| Test plugins               | vitest block on test globs; playwright block on `e2e/**/*.ts`.                                                                                                                     |
| `no-console` in src        | With ordered exemptions (observability, seed/init-bucket, scripts, tests, tooling).                                                                                                |
| Working agreement          | Tool-agnostic version of the template's behavioral guidelines in AGENTS.md.                                                                                                        |
| `verbatimModuleSyntax`     | Zero violations on adoption — free strictness.                                                                                                                                     |

## Rejected practices

| Practice                                            | Reason                                                                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Biome (as second linter or formatter)               | We already run type-aware ESLint + Prettier; a second linter adds config surface and overlap for no measured gain (ADR 0011 already rejected it as primary).                                       |
| Local custom-rules plugin (`quality/*`)             | Core `no-console`, `max-lines`, and `no-restricted-imports` cover the three things the reference plugin did for our stack — no need to own rule code.                                              |
| Dual lint tiers (`lint`/`lint:types`)               | Full `turbo run lint --force` is ~25s warm/parallel and ~4–6s cached; splitting buys nothing until lint exceeds ~30s (tracked as P3 in TODO).                                                      |
| `eslint-plugin-import-x`                            | Our only boundary needs are module-internal (already covered by `no-restricted-imports` in `packages/core`) and UI→db/auth (covered by the same core rule). No resolution/zones complexity needed. |
| Claude Code hooks/settings, MEMORY.md               | Environment here is Devin/other agents, not Claude Code; the durable part (working agreement) was adapted into AGENTS.md, which every tool reads.                                                  |
| `security/detect-object-injection`                  | Fires on every `obj[key]`; `noUncheckedIndexedAccess` already forces handling. Pure noise.                                                                                                         |
| Explicit `minimumReleaseAge` in pnpm-workspace.yaml | pnpm's built-in default (1440 min) already applies supply-chain delay; pinning the same value adds a number to maintain and no protection.                                                         |
| `erasableSyntaxOnly` (for now)                      | 7 parameter-property sites across 7 files exceed the >3-file fix budget; mechanical expansion deferred to a TODO item, then re-trial.                                                              |
| `**/e2e/**` in base ignores                         | Would globally exclude specs and make the apps/web playwright block unreachable; the vitest globs never matched `*.spec.ts` anyway.                                                                |

## Reasons for divergence

- **Single lint tier**: the reference splits tiers because its fast tier runs
  in a pre-commit hook; our lint is already type-aware everywhere and fast
  enough, so a second config would only duplicate maintenance.
- **Plugin deps stay in `@crm/eslint-config`**: consumers import ready-made
  blocks (`./base`, `./next`, `./playwright`) — plugin imports resolve inside
  the config package, so app packages never need plugin deps of their own.
- **`no-duplicate-imports` + `allowSeparateTypeImports`**: the codebase's
  import style is `import type` + `import` pairs by design; merging 40 sites
  would fight `consistent-type-imports` for zero benefit.
- **e2e lintable**: see "Rejected practices" — the ignore would have been
  self-defeating with the playwright block.

## Compatibility considerations

- **TypeScript**: pinned 6.0.3 — `typescript-eslint@8.71` requires
  `typescript <6.1.0`, and TS 7 (native Go port) has no lint-plugin API until
  TS 7.1 (track typescript-eslint#10940). `verbatimModuleSyntax` is supported
  since TS 5.0; `erasableSyntaxOnly` since TS 5.8 — both exist in TS 6.
- **ESLint**: pinned 9.39 — `eslint-config-next@16` pulls
  `eslint-plugin-react`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`,
  which support ≤ESLint 9. All five new plugins support ESLint 9 flat config.
- **Node**: pinned ≥24 — `globals@17`, `@vitest/eslint-plugin@1.6`, and
  `eslint-plugin-playwright@2.12` all support it. Node 26 LTS migration is a
  P1 TODO (after 2026-10-28).
- **pnpm 12**: `minimumReleaseAge` default 1440 min applies to the new pins
  automatically; `minimumReleaseAgeExclude` unchanged for turbo/sentry/aws
  entries already listed.

## Consequences

- Lint failures are now more meaningful: errors are always-a-bug/zero-count
  rules; warnings are a visible, countable budget (12 warnings at adoption).
- UI↔server boundary is enforced, not just documented — `src/server/services.ts`
  is the seam.
- CI now blocks unformatted code (`pnpm format:check` after install).
- The lockfile shows a one-time formatting rewrite because pnpm 12.8.1
  serializes YAML differently than the previously committed file — semantic
  content is unchanged apart from the five new plugins.
- Editors get consistent formatter/linter recommendations without imposing a
  specific IDE.

## Future considerations

- Promote warn-tier rules to error as counts hit zero (tooling.md workflow);
  `prefer-nullish-coalescing` is one fix away.
- Re-trial `erasableSyntaxOnly` after expanding the 7 constructor parameter
  properties (mechanical; unlocks Node type-stripping/tsgo parity).
- Split typed/untyped lint tiers if lint time exceeds ~30s.
- TS 7 migration when typescript-eslint#10940 lands (API in TS 7.1); tsgo
  sidecar typecheck is an intermediate option.
- If a real domain-specific anti-pattern emerges that no plugin covers,
  revisit the local-rules plugin decision with the same measurement process.

## Alternatives considered

- Full copy of the reference config (import-x zones + custom plugin +
  Biome): rejected — measured against this codebase it adds tooling surface
  without catching more real issues.
- Keeping `pnpm lint` non-type-aware and adding `lint:types`: rejected — see
  "Reasons for divergence".
