---
name: test
description: Etapa /test do workflow do repo — gate mínimo (typecheck + lint + testes relevantes); falhas entram no debugging-and-error-recovery.
---

Run this repo's verification gate (`docs/development/workflow.md` →
"Gates de qualidade"):

1. Minimal per edit session: `pnpm typecheck` then `pnpm lint`, plus the
   tests of the touched package (`pnpm --filter @crm/<pkg> test`).
2. Full gate before commit/phase review: `pnpm format && pnpm lint &&
   pnpm typecheck && pnpm test && pnpm test:integration && pnpm test:e2e
   && pnpm build`.
3. On any failure, invoke `debugging-and-error-recovery` for triage —
   reproduce, find root cause, fix that (not the symptom).
4. When the change touches UI or a user flow, invoke
   `browser-testing-with-devtools` for real-browser evidence (console,
   network, DOM) via the project's chrome-devtools MCP.
