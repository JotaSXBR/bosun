# Plan — Code quality standard: research, diff, apply, document

## Overview

Define the industry-established code-quality bar for this stack
(Next.js 16 + React 19 + TS 6 + ESLint 9 flat + typescript-eslint 8 +
Prettier 3 + Vitest 5 + Playwright + Drizzle + pnpm/Turbo monorepo) from
external documentation only, diff the repo's lint/format/tsconfig/hooks/CI
against it, measure violations before enabling rules, apply to the shared
`@crm/eslint-config` package, and document adopted/rejected decisions with
sources in `docs/development/code-quality-standard.md`.

No product features. No business-code refactors to zero out warnings
(size/complexity budgets stay visible as `warn` until their count is zero).

## Escopo

- `tooling/eslint/**`
- `tooling/typescript/**`
- `tooling/prettier/**`
- `apps/web/eslint.config.js`
- `design-system/eslint.config.js`
- `packages/*/eslint.config.js`
- `apps/web/tsconfig.json`
- `design-system/tsconfig.json`
- `packages/*/tsconfig.json`
- `lefthook.yml`
- `.github/workflows/**`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `docs/**`
- `tasks/**`

## Task List

- [x] **T1** External research: doc-verified standard per practice area
      (tooling split, typed linting, size/complexity metrics, TS flags,
      React/Next, server, tests/e2e, import boundary, hook/CI, severity
      policy) — every threshold from official docs or canonical source
      with URL.
- [x] **T2** Write the standard: `docs/development/code-quality-standard.md`
      §1 — research written before reading repo configs.
- [x] **T3** Diff repo config (tooling/*, eslint.config.js per workspace,
      lefthook.yml, ci.yml, tsconfigs) vs the standard — classified in §2.1.
- [x] **T4** Measure: `eslint . --format json` across all 14 workspaces —
      zero → error; >0 → warn + recorded count (§2.3).
- [x] **T5** Apply: `tooling/eslint/base.js` rewritten (presets, sonarjs,
      security subset, consolidated boundaries, test relaxations),
      `playwright.js` → flat/recommended, `base.json` +5 strict flags,
      deps added to `tooling/eslint`.
- [x] **T6** Verify gate: `typecheck` 14/14, `lint` 14/14 (0 errors),
      `test` 167/167, `format:check` green.
- [x] **T7** Document adoption: §2 (classification, stylistic measurement,
      warn counts blocking promotion, rejections, files changed).
