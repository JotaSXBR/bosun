---
name: plan-task
description: Etapa /plan do workflow do repo — escreve tasks/plan.md (contrato de escopo com ## Escopo) via planning-and-task-breakdown, após o gate de esclarecimento. Nome é plan-task porque /plan é built-in do Devin (modo Plan).
argument-hint: "<item do backlog ou referência ao spec>"
---

Invoke the `planning-and-task-breakdown` skill for $ARGUMENTS, adapted to
this repo (`docs/development/workflow.md`):

1. **Gate de esclarecimento first** — before writing anything, identify
   ambiguities that affect scope or architecture and ask via
   `ask_user_question`. Answers go into the plan's `## Contexto`.
2. Write `tasks/plan.md` using `docs/development/plan.template.md` —
   it must carry `## Contexto` (the why) and `## Escopo` (repo-root globs).
   **The `## Escopo` globs are the scope contract**: a PreToolUse hook
   blocks edits to source/config files outside them. Include test files
   and the touched package/route folders; docs/markdown are always free.
3. Mirror tasks in `tasks/todo.md` with acceptance + verify per task.
4. Only one active plan at a time — if `tasks/plan.md` already exists and
   is unfinished, stop and ask the user whether to finish or replace it.
5. Mid-work scope expansion = edit the plan's `## Escopo` (ask first).
   Done → archive as `tasks/plan-<item>.done.md` + `tasks/todo-<item>.done.md`.
