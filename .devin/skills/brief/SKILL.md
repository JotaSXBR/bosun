---
name: brief
description: Create or refresh .task-brief.md, the scope contract for the current work item. Use when starting any feature/change that touches source or config files, when the user asks "create the brief", "novo brief", or when work is about to begin without a brief. The PreToolUse hook blocks out-of-scope edits, so the brief must exist before coding.
triggers:
  - user
  - model
allowed-tools:
  - read
  - write
  - grep
  - glob
---

Create `.task-brief.md` at the repo root from `docs/development/task-brief.template.md`.

1. Identify the work item: the user's request, the matching `TODO.md` entry
   ("Produto — backlog" or "Implementação futura"), and the relevant
   `docs/product/*` doc. Read them first.
2. Fill Objetivo in one sentence — what gets delivered.
3. Write `## Escopo` globs — the directories/files this work may touch.
   Be generous enough to avoid false blocks (include the tests, the package
   dir, the app route dir), tight enough to catch drift (don't add `**`).
   Source/config only — docs and markdown are always allowed by the hook.
4. Fill `## Fora de escopo` with the tempting-but-deferred neighbors.
5. Fill `## Critérios de pronto` with the real verification for this work
   (not generic boilerplate).
6. Show the user the Escopo list and ask for confirmation before editing —
   the hook will block anything outside it.
7. If a `.task-brief.md` already exists for a DIFFERENT work item, ask the
   user whether to replace it (rename the old one to
   `.task-brief-<item>.done.md` first, or finish that item).

Only one active brief at a time. When the work is done, delete
`.task-brief.md` or archive it — don't leave a stale scope gate behind.
