---
name: ship
description: Etapa /ship do workflow do repo — commit convencional (só quando o usuário pedir), arquivamento do plan e atualização do TODO.md, via git-workflow-and-versioning + shipping-and-launch.
---

Invoke `git-workflow-and-versioning` and `shipping-and-launch`, adapted
to this repo (`docs/development/workflow.md`, `AGENTS.md`):

- **Commits only on explicit user request** — never commit unprompted.
  Conventional Commits (`feat:`, `fix:`, `chore:`...); PRs via `gh` CLI.
- Before shipping: the full quality gate must be green (see `/test`).
- On phase completion: archive `tasks/plan.md` →
  `tasks/plan-<item>.done.md` (+ `tasks/todo-<item>.done.md`), and move
  the item to `## Concluído` in `TODO.md` (or update its status line).
- Invoke axis skills when they apply: `ci-cd-and-automation` (pipeline),
  `documentation-and-adrs` (docs/ADR needed), `observability-and-instrumentation`
  (logs/metrics), `deprecation-and-migration` (removals/migrations).
