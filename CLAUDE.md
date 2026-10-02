@AGENTS.md

Claude-specific notes:

- Read `docs/architecture/*.md` before non-trivial changes.
- After code edits run `pnpm typecheck` before lint — type errors are cheaper
  to catch first.
- Prefer `pnpm --filter @crm/<pkg> test` over the full suite while iterating.
