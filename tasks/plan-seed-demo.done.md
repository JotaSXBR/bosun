# Plan — Seed demo rico (org vendendo o próprio Bosun)

- **Origem**: pedido do usuário — avaliar as funções do app com dados realistas
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-13

## Objetivo

`pnpm db:seed` passa a popular a org Demo com dados realistas (contatos,
conversas, deals, IA, site chat) retratando uma empresa que vende o próprio
Bosun pelos canais de atendimento — permitindo avaliar o app com telas cheias.

## Contexto

- Ambiente: local primeiro; staging fica para depois (NODE_ENV=production
  bloqueia o seed por design — apontar o script pro banco de staging é
  decisão separada).
- Estrutura: estender o seed existente (idempotente como hoje), mantendo
  users/org/teams/funil atuais.
- Conteúdo: pt-BR, tema "vendemos o Bosun" — prospects perguntando de preço,
  integração WhatsApp, multi-tenant, trial; deals de assinatura no funil.
- Módulos cobertos: Inbox+Contatos, Deals/Funil, IA/Brain, Site chat widget.

## Escopo

packages/auth/src/**
docs/**
tasks/**

## Fora de escopo

- Semear staging (banco remoto) — decisão/execução separada.
- UI/UX (Stitch) — nada de código de interface.
- Novas tabelas ou migrações.

## Tarefas

1. `seed-content.ts`: dataset demo (contatos, conexões, conversas+mensagens,
   deals, labels aplicadas, agentes/knowledge/sugestões/uso, site chat sessions)
   — idempotente por chaves naturais, chamado por `main()` em `seed.ts`.
2. Rodar `pnpm db:seed` local e conferir contagens/telas.
3. `pnpm verify` + commit.

## Critérios de pronto

- [ ] `pnpm db:seed` idempotente (2ª execução sem duplicar)
- [ ] `pnpm verify` verde
- [ ] Login `owner@crm.local` mostra inbox, funil, IA e widget com dados
