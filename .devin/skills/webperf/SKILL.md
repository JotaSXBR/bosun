---
name: webperf
description: Audit de performance standalone (fora do loop principal) — mede antes de otimizar via performance-optimization.
argument-hint: "<rota, query ou fluxo a auditar>"
---

Invoke `performance-optimization` for $ARGUMENTS as a standalone audit:

- Measure first — this repo's perf findings live in `docs/audits/` (see
  `docs/audits/perf-baseline-2026-10-11.md` for format: numbered F-findings
  with measured evidence and query plans).
- Cover the repo's hot paths: `@crm/core` reads (inbox lists, kanban),
  pg query plans, N+1, SSE refresh behavior, bundle weight.
- Write findings to `docs/audits/perf-<scope>-<date>.md` and link the
  accepted fixes in `TODO.md` → "P2 — Perf".
