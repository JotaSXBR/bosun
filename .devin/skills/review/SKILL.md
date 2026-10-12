---
name: review
description: Etapa /review do workflow do repo — code-review-and-quality no diff + checklist UX das 7 leis para telas novas/alteradas; skills de eixo quando aplicáveis.
argument-hint: "[diff ou faixa de commits a revisar]"
---

Invoke `code-review-and-quality` on the diff ($ARGUMENTS — staged/working
diff or the phase's commits, `git diff main...HEAD` on a branch), per
`docs/development/workflow.md`:

- If new or changed screens: also apply the UX 7-leis checklist at
  `docs/development/ux-7-leis-checklist.md` — it's a review gate, not a
  suggestion.
- Invoke axis skills when the diff touches their area:
  `code-simplification` (accumulated complexity), `security-and-hardening`
  (auth/webhooks/data/deps), `performance-optimization` (queries, N+1,
  bundle).
- Check the plan's Critérios de pronto in `tasks/plan.md` — the review
  also confirms each box can be ticked honestly.
