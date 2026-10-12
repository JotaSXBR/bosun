# TODO — Slice 4: Atendimento

- [x] **Task 1 — Abas**: `TAB_VIEWS` (queue/mine/snoozed/closed) + `FILTER_VIEWS`
      (pending/all); nav só abas com contador; `aria-current` correto
- [x] **Task 2 — Filtro Ver**: Select em pílula ao lado da busca (pending=all
      values); placeholder "Ver" quando aba ativa; `inbox.filters.ver`
- [x] **Task 3 — Larguras**: lista `inbox-list(-sm)` e aside `inbox-aside(-sm)`
      com breakpoint `wide:` (106.25rem) — rem para ordenar com os padrões
- [x] **Task 4 — Vocabulário**: Sugestão→Rascunho na conversa (drafts/nudges/
      composer.draftRequested); "Gerar rascunho"
- [x] **Task 5 — e2e + gate**: inbox.spec atualizado; format/typecheck/lint/
      test; visual 1920 + 1536

## Verificado

- Chrome: 4 abas c/ contador, combobox "Ver" → `?view=all|pending` navega;
  `view=pending` sem `aria-current` e select mostra "Automático".
- Larguras: 360px (lista+aside) @1920×930, 320px @1536×740, sem rolagem
  horizontal nos dois; `/app/inbox/<id>` → `?c=` 307.
- Gate: format ✅, typecheck ✅, lint 0 erros (meus arquivos 0 warnings),
  `@crm/web` 9/9 ✅, `@crm/design-system` 9/9 ✅.
