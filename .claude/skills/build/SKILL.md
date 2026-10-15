---
name: build
description: "Etapa /build do workflow do repo — implementação incremental em slices finos com teste junto, dentro do ## Escopo do tasks/plan.md ativo."
argument-hint: "<task ou slice do plan a implementar>"
---

Invoke `incremental-implementation` for $ARGUMENTS, together with
`test-driven-development` (test written with the change), per
`docs/development/workflow.md`:

- Work only inside the active `tasks/plan.md` `## Escopo` globs — the hook
  blocks edits outside them. Need more files? Ask the user to expand the
  plan's Escopo first.
- Slice thin and verifiable; run the relevant tests per slice.
- Invoke the axis skills when they apply: `frontend-ui-engineering` (UI),
  `api-and-interface-design` (new contracts), `source-driven-development`
  - `context7-mcp` (library/framework APIs — check official docs),
    `doubt-driven-development` (risky decision), `context-engineering`
    (context/rules setup).
- Follow `AGENTS.md` code rules (no `any`, surgical diffs, Server Action
  return contract, pg-error helpers, design-system tokens for UI).
- No commits unless the user explicitly asks — the vendored
  `incremental-implementation` "Commit each slice" step is overridden by
  the `AGENTS.md` working agreement (prepare the commit, don't create it).
