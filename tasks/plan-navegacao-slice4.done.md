# Plan — Slice 4: Atendimento (abas, filtro Ver, larguras por token, vocabulário)

## Objetivo

Aplicar a estrutura de Atendimento de `ia-navegacao.md` §3/§5 e as larguras da
família Layout (`layout-desktop-app.md` §4) ao inbox: **4 abas com contador** +
**filtro "Ver"** (Select em pílula ao lado da busca), larguras por token com
variante `-sm` abaixo do limiar, e vocabulário Rascunho/Aviso na conversa.

## Critérios de pronto

- [ ] Abas: Fila, Minhas, Adiados, Fechadas — cada uma com contador; nenhuma
      outra view como aba.
- [ ] Select "Ver" em pílula ao lado da busca com `Automático` (`?view=pending`)
      e `Todas` (`?view=all`); `view` continua único parâmetro (6 valores, 2
      renderizados no select, 4 como aba).
- [ ] Lista usa `w-inbox-list`/`w-inbox-list-sm` e o painel direito
      `w-inbox-aside`/`w-inbox-aside-sm`, com troca no limiar de 1700px.
- [ ] Strings da conversa: Rascunho (era Sugestão) e Aviso/"Gerar rascunho";
      fila de revisões (`settings/ai`) fica para o Slice 5.
- [ ] e2e `inbox.spec.ts` atualizado (4 abas + select Ver).
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verde.

## Tarefas

1. **Abas → 4** — `inbox/page.tsx`: `VIEWS` vira `TAB_VIEWS` (queue, mine,
   snoozed, closed) + `FILTER_VIEWS` (pending, all); o `<nav>` só itera abas;
   `aria-current` só quando `view` é aba. Contadores seguem `counts[v]`.
2. **Filtro "Ver"** — `InboxFilters`: `Select` em pílula ao lado do `Input` de
   busca com options pending/all; `value` = `view` quando pending|all, senão
   `undefined` (placeholder "Ver"); `onChange` navega `?view=<v>` (mesmo
   `replace`, cai fora das abas). Chave `inbox.filters.ver` = "Ver".
3. **Larguras por token** — lista: `lg:w-inbox-list-sm
min-[1700px]:w-inbox-list`; aside: `w-inbox-aside-sm
min-[1700px]:w-inbox-aside`. Limiar 1700px (nota do Slice 1). Mobile `?c=`
   inalterado (`hidden lg:flex`).
4. **Vocabulário** — `drafts.title`→"Rascunho da IA",
   `drafts.newDraftToast`→"Novo rascunho de resposta",
   `nudges.generate`→"Gerar rascunho", `nudges.generatingToast`→"Gerando
   rascunho…", `inbox.draftRequested`→"Gerando rascunho — aparece aqui em
   instantes.". (Composer já usa "Sugerir/Melhorar resposta" ✓.)
5. **e2e** — `inbox.spec.ts`: 4 links de aba + combobox "Ver" com as 2 opções.
6. **Gate** — format/typecheck/lint/test; visual owner em 1920 e 1536.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

apps/web/src/app/app/inbox/**
apps/web/src/components/inbox-filters.tsx
apps/web/e2e/inbox.spec.ts
apps/web/messages/pt-BR.json
design-system/src/styles/globals.css

## Fora de escopo

- Vocabulário da fila de revisões / `settings/ai` (Proposta/Revisões) — Slice 5.
- "Ensinar a IA" na conversa — Slice 5 (módulo Inteligência, spec §7.3).
- Ficha do contato, painel direito novo — PREV (E2).
- `design-system/**` — tokens e componentes já existem do Slice 1.
- Backends (`listConversations`, `listConversationCounts`) — views já existem.
- Comportamento mobile abaixo de `lg` — já resolvido via `?c=`.

## Riscos

- `view=pending|all` sem aba ativa: lista + empty states já existem para as 6
  views; `aria-current` ausente é o comportamento esperado.
- `Select` placeholder "Ver" quando aba ativa — estado neutro intencional.
- Limiar 1700px: medir nos dois viewports do contrato no verify.
