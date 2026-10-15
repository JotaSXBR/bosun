---
name: test
description: Etapa /test do workflow do repo — gate mínimo (typecheck + lint + testes relevantes); falhas entram no debugging-and-error-recovery.
---

Run this repo's verification gate — the single source is the
`verify`/`verify:full` scripts in the root `package.json`
(`docs/development/workflow.md` → "Gates de qualidade"):

1. Per edit session: `pnpm verify`. While iterating, the shortcut is
   `pnpm --filter @crm/<pkg> test` + `pnpm typecheck`/`pnpm lint`.
2. Full gate before merge / for DB-provider changes: `pnpm verify:full`.
3. On any failure, invoke `debugging-and-error-recovery` for triage —
   reproduce, find root cause, fix that (not the symptom).
4. When the change touches UI or a user flow, invoke
   `browser-testing-with-devtools` for real-browser evidence (console,
   network, DOM) via a chrome-devtools MCP (not configured by default — ask the user first).
