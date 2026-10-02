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
- E2E runs Playwright with a real seeded DB; `webServer` starts `pnpm dev`.

## Per-package

`pnpm --filter @crm/<pkg> test` runs just that package's unit tests.
