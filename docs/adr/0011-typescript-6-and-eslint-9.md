# 0011: TypeScript 6 + ESLint 9

Status: accepted

## Context

Toolchain versions for a greenfield repo; Next 16 supports TS 6 and flat
ESLint 9 config.

## Decision

TypeScript 6.0.3 strict (`strict`, `noUncheckedIndexedAccess`, bundler
resolution, ES2023) via shared `tooling/typescript` presets; ESLint 9.39
flat config (`tooling/eslint/base.js`) with `typescript-eslint`
`recommendedTypeChecked` + `projectService`, `no-explicit-any`,
`no-floating-promises`, `consistent-type-imports`, and
`simple-import-sort`.

## Consequences

- Type-aware linting catches promise leaks and unsafe access early.
- One config per package (`import base from "@crm/eslint-config/base"`).
- Upgrades bump `docs/architecture/stack.md` first — versions are pinned
  there, not improvised per package.

## Alternatives considered

- Biome: faster but no type-aware rules — rejected as primary linter.
- Non-type-checked lint: misses floating promises — rejected.
