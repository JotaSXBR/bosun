---
name: spec
description: Etapa /spec do workflow do repo — escreve o PRD em docs/product/ via spec-driven-development. Use para features novas com comportamento visível, itens do TODO sem decisões registradas ou ambiguidade de produto.
argument-hint: "<item do backlog ou descrição da feature>"
---

Invoke the `spec-driven-development` skill for $ARGUMENTS, adapted to this repo:

- The spec is a PRD under `docs/product/<item>.md` in this project's format
  (see `docs/product/inbox.md`, `docs/product/ai-agents.md` for structure —
  Vision, sections per capability, Non-goals). Do **not** write `SPEC.md`
  at the repo root.
- Check first whether `docs/product/` or `TODO.md` already covers the item —
  if it does, `/spec` can be skipped and the work goes straight to
  `/plan-task` (see `docs/development/workflow.md` → "Quando /spec é
  obrigatório").
- For raw or ambiguous ideas, invoke `interview-me` or `idea-refine`
  before drafting.
- Product copy decisions are pt-BR; the spec itself follows the language
  of the existing docs/product files.
- After the spec is written, the next step is `/plan-task`.
