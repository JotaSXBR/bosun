# Task brief — <nome do item>

- **Origem**: `TODO.md` → <item> · `docs/product/<doc>.md`
- **Lifecycle**: /brief → /plan → /build → /test → /review → /ship
- **Data**:

## Objetivo

<uma frase — o que esta entrega faz existir>

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

packages/core/src/modules/<modulo>/**
apps/web/src/app/app/<rota>/**

## Fora de escopo

<o que NÃO tocar mesmo parecendo relacionado — fica para outro brief>

## Critérios de pronto

- [ ] `pnpm typecheck` + `pnpm lint` verdes
- [ ] Testes alvo: <quais — ex.: `*.int.test.ts` do módulo>
- [ ] Docs atualizadas: <quais>
- [ ] `TODO.md` movido para Concluído
