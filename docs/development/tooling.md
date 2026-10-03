# Tooling: lint, format, test topology

How the quality gates are wired, and how to change them. Rationale and the
rejected alternatives live in [docs/adr/0013](../adr/0013-engineering-tooling-reference.md).

## Topology

| Layer       | Tool                        | Where                                                              | Command                                         |
| ----------- | --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Lint        | ESLint 9 flat config        | `tooling/eslint` (`base.js`, `next.js`, `playwright.js`)           | `pnpm lint` → `eslint .` per package via turbo  |
| Typecheck   | TypeScript 6 `tsc --noEmit` | `tooling/typescript` (`base`/`library`/`nextjs` presets)           | `pnpm typecheck`                                |
| Format      | Prettier                    | `tooling/prettier` (`@crm/prettier-config` via `.prettierrc.json`) | `pnpm format` / `pnpm format:check`             |
| Unit tests  | Vitest                      | `*.test.ts` next to sources                                        | `pnpm test`                                     |
| Integration | Vitest (`.int.test.ts`)     | real Postgres/RustFS                                               | `pnpm test:integration` (needs `pnpm infra:up`) |
| E2E         | Playwright (`*.spec.ts`)    | `apps/web/e2e`                                                     | `pnpm test:e2e`                                 |

Every workspace package gets the shared config by importing it —
`import base from "@crm/eslint-config/base"` — and optionally stacking local
blocks after it. Flat config ordering matters: for a file matched by two
blocks, the later block's rules win. That is why `no-console` exemptions and
the test-file relaxations sit _after_ the blocks that enable them in
`base.js`.

`apps/web` additionally spreads `@crm/eslint-config/playwright` (the
`e2e/**/*.ts` block) and defines the UI boundary itself.

## Severity policy

- **`error`** — always a bug, always unsafe, or a zero-violation rule. Fails
  lint and CI.
- **`warn`** — refactoring pressure, or a heuristic with real false-positive
  rate (complexity budgets, `security/detect-unsafe-regex`, promoted
  candidates still burning down).

### Promotion workflow (warn → error)

1. Introduce the rule at `warn`; note the violation count.
2. Burn the count down as part of normal work (the count is the plan — not a
   "someday" comment).
3. When the count reaches zero, flip to `error`. Zero → error adoptions need
   no burn-down: `prefer-optional-chain`, `no-unnecessary-type-assertion`,
   and `restrict-template-expressions` (allowNumber) entered at error because
   the initial count was zero.
4. If a warn rule stays noisy (>~15 violations, or the warnings don't point
   at real issues), loosen the option or drop the rule — noise teaches
   people to ignore lint.

Current warn-tier counts (baseline for the burndown): `complexity` 4,
`max-statements` 3, `@typescript-eslint/no-unnecessary-condition` 4,
`@typescript-eslint/prefer-nullish-coalescing` 1.

## Plugin inventory

All plugin deps live in `@crm/eslint-config` so consumers never manage them.

| Plugin                     | Scope                    | Rules                                                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript-eslint`        | all files                | `recommendedTypeChecked`, `consistent-type-imports`, `no-explicit-any`, `no-floating-promises`, `no-unused-vars` (`^_` escape), promoted strictTypeChecked set          |
| `simple-import-sort`       | all files                | `imports` + `exports` error                                                                                                                                             |
| `eslint-plugin-security`   | `**/src/**`              | `detect-eval-with-expression` err, `detect-pseudoRandomBytes` err, `detect-unsafe-regex` warn, `detect-child-process` warn — `detect-object-injection` deliberately off |
| `eslint-plugin-drizzle`    | `**/src/**`              | `enforce-delete-with-where` / `enforce-update-with-where` err, `drizzleObjectName: ["db","tx"]`                                                                         |
| `@vitest/eslint-plugin`    | test globs               | `no-focused-tests` err, `no-disabled-tests` warn, `no-commented-out-tests` warn                                                                                         |
| `eslint-plugin-playwright` | `e2e/**/*.ts` (apps/web) | `no-focused-test` err, `no-conditional-in-test` warn, `no-networkidle` warn                                                                                             |
| `eslint-config-next`       | apps/web                 | `core-web-vitals`                                                                                                                                                       |

Core-rule additions: `no-var`, `prefer-const`, `no-empty`
(`allowEmptyCatch`), `eqeqeq` (`null: "ignore"`), `no-duplicate-imports`
(`allowSeparateTypeImports` — the repo splits `import type` from value
imports on purpose), `no-console` on `**/*.{ts,tsx}`, and the
size/complexity warn tier on `**/src/**` (`complexity` 12, `max-depth` 4,
`max-params` 4, `max-statements` 20, `max-nested-callbacks` 3,
`max-lines-per-function` 150, `max-lines` 350 as error).

## Boundaries

- `apps/web`: `src/**/*.tsx` and `src/components/**/*.ts` must not import
  `@crm/db`, `drizzle-orm`, or `@crm/auth`. UI reaches data through
  `src/server/*` (e.g. `services.ts`) and `@crm/core` services.
- `packages/core`: module internals can't cross-import (`src/modules/*`),
  pre-existing rule.
- e2e files are _not_ in the test-file relaxation globs — `*.spec.ts` runs
  under `@playwright/test`, not vitest, and gets the playwright rules plus
  the normal error tier.

## Adding a rule or an exception

- New rule → add it at `warn` scoped to the right `files` glob, run
  `pnpm turbo run lint --force --continue`, record the count, then follow the
  promotion workflow.
- Per-package exception → a trailing block in that package's
  `eslint.config.js` (see `packages/observability` disabling `no-console`
  locally). Per-file one-offs → `// eslint-disable-next-line <rule>` with a
  reason comment.
- Repo-root-shaped globs like `packages/observability/**` only match when
  eslint runs from the root. `pnpm lint` runs `eslint .` **per package**, so
  package-local exemptions belong in the package's own config file.

## Prettier boundary

Prettier formats; ESLint lints. No formatting rules in ESLint, no eslint
prettier plugin. `.prettierignore` excludes generated content (lockfile,
migrations, `.next`, reports, `research/`, env files, `next-env.d.ts`).
CI runs `pnpm format:check` before turbo tasks — run `pnpm format` locally.

## Editor setup

`.vscode/settings.json` makes Prettier the default formatter for
ts/tsx/json/jsonc/yaml/markdown with format-on-save, and sets
`eslint.workingDirectories: [{ "mode": "auto" }]` so the ESLint extension
resolves each package's own config. `.vscode/extensions.json` recommends
prettier, eslint, tailwindcss, vitest.explorer, ms-playwright.playwright.
