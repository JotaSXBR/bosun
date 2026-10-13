# Testing

| Kind        | File                     | Command                 | Infra needed       |
| ----------- | ------------------------ | ----------------------- | ------------------ |
| Unit        | `*.test.ts`              | `pnpm test`             | none               |
| Integration | `*.int.test.ts`          | `pnpm test:integration` | Postgres (+RustFS) |
| E2E         | `apps/web/e2e/*.spec.ts` | `pnpm test:e2e`         | all + seed         |

## Conventions

- Unit tests mock providers via injected `fetch` or the `@crm/*/testing`
  fakes — never hit the network.
- Integration tests require the real services (`pnpm infra:up` +
  `pnpm db:migrate` + `pnpm storage:init` first). They **fail clearly** when
  the DB is unavailable — that's a signal, not a pass condition (the storage
  suite skips only when storage env vars are entirely absent).
- RLS/tenant behavior is covered by integration tests, not unit tests.
- E2E runs Playwright with a real seeded DB; `webServer` starts `pnpm dev`
  locally and the standalone production build in CI (`next dev`'s compile
  loop was too heavy for hosted runners — see playwright.config.ts).

## Per-package

`pnpm --filter @crm/<pkg> test` runs just that package's unit tests.

## Two unit-test paths (on purpose)

- `pnpm test` — root `vitest run` over `vitest.config.ts`. Local
  convenience: fastest way to run the whole unit suite in one pass.
- `turbo run test` — each package's own `test` script (same `*.test.ts`
  glob, per-package vitest). This is what CI's quality job runs; use it
  when you need the exact CI behavior (package boundaries, caching).

Both run the same files — a test that passes under one and fails under
the other signals a config drift to fix, not two suites to keep.

## Coverage

`pnpm test:coverage` (`turbo run test:coverage`, v8) prints per-package
coverage. Baseline measured 2026-10-13 (unit tests only — `*.int.test.ts`
files are excluded, so packages whose suites are mostly integration tests
read low by design):

| Package         | % Stmts | % Branch | % Funcs | % Lines |
| --------------- | ------- | -------- | ------- | ------- |
| `permissions`   | 100     | 100      | 100     | 100     |
| `observability` | 96.7    | 95.8     | 88.9    | 96.4    |
| `web`           | 89.6    | 90.2     | 78.6    | 91.2    |
| `ai`            | 88.6    | 68.4     | 66.7    | 90.8    |
| `billing`       | 87.3    | 77.1     | 87.5    | 91.4    |
| `email`         | 85.7    | 72.7     | 75.0    | 85.7    |
| `config`        | 81.8    | 63.2     | 76.2    | 85.0    |
| `channels`      | 80.4    | 68.0     | 78.5    | 84.5    |
| `storage`       | 54.5    | 39.1     | 50.0    | 54.8    |
| `core`          | 22.1    | 14.8     | 16.1    | 23.3    |
| `automation`    | 12.7    | 2.1      | 10.7    | 14.0    |
| `db`            | 8.7     | 0        | 0       | 9.5     |
| `auth`          | 0       | 0        | 0       | 0       |
| `design-system` | 0       | 0        | 0       | 0       |

**No threshold is enforced yet** — per the audit (AUD-020/D12) thresholds
are set only after this baseline, per-package rather than repo-wide, and
must include `*.int.test.ts` coverage for `core`/`db`/`automation` to be
meaningful.
