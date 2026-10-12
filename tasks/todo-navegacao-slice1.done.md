# TODO — Slice 1: tokens de layout + PageHeader compacto + AppShell

- [x] **Task 1 — Tokens "Layout"**: `DESIGN.md` spacing + `tokens/spacing.css` + `@theme` em `globals.css` + sync `adherence.oxlintrc.json`. Verify: `pnpm --filter @crm/design-system test` (drift) ✅
- [x] **Task 2 — `PageHeader` compacto + `back`**: variante 56px (título `h3`, abas na linha) + `IconButton` `arrow-left` (`asChild` novo via Slot); variantes no showcase. Verify: typecheck + `/design-system` ✅
- [x] **Task 3 — Template `AppShell`**: grade `100dvh`, `topBar`/`header` fixos, rolagem independente por painel; seção no showcase. Verify: typecheck + `/design-system` ✅
- [x] **Task 4 — Docs**: `COMPONENTS.md` + `DESIGN.md` (Templates, vocabulário) + `design-system/README.md` ✅
- [x] **Checkpoint**: `pnpm format` + typecheck 14/14 + lint 0 erros + DS test 9/9; medido 1920×930 e 1536×740 (innerWidth/innerHeight, sem rolagem horizontal); `TODO.md` ✅
