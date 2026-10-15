---
name: code-simplify
description: Rodada de simplificação standalone (fora do loop principal) — reduz complexidade acumulada sem mudar comportamento via code-simplification.
argument-hint: "<arquivo, módulo ou área a simplificar>"
---

Invoke `code-simplification` on $ARGUMENTS:

- Behavior must not change — simplification only; run the touched
  package's tests after each slice.
- Respect `AGENTS.md`: surgical diffs, match surrounding style, no
  speculative abstraction, strict TS (no `any`).
- Stay inside the active plan's `## Escopo` if a `tasks/plan.md` exists —
  otherwise confirm the target area with the user before editing.
