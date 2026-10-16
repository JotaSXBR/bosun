# Plan — Google Contacts: perfil do contato (slice 2/3)

- **Origem**: `TODO.md` → P2 Google (slice 2) · `docs/product/contacts-google-sync.md` (§ Contact model)
- **Lifecycle**: spec ✓ → plan → build → test → review → ship
- **Data**: 2026-10-15

## Objetivo

O contato passa a ter um perfil completo dentro do Bosun (empresa, cargo,
endereço, aniversário, sites, além de e-mail, telefone extra e notas),
editável na ficha do inbox e em `/app/contacts`, sem depender do Google.

## Contexto

Decisões (gate de esclarecimento, 2026-10-15):

- **Regra do usuário**: os dados vivem no Bosun e funcionam sem Google
  configurado; o espelho no Google (slice 3) sincroniza quando existir
  conexão. Esta slice **não toca no Google** e não enfileira nada — o
  push (e o sync inicial em massa ao conectar) é a slice 3.
- **Chaves planas em `contacts.metadata`** (`company`, `jobTitle`,
  `address`, `birthday`, `urls` ao lado de `email`, `phone`, `notes`),
  validadas por zod. Sem aninhar em `metadata.profile`: não exige migração
  de dados e não quebra o ingest do site_chat nem quem lê `metadata.email`.
  Os nomes seguem o mapeamento do spec (organizations, addresses,
  birthdays, urls).
- **Edição em `/app/contacts`**: dialog "Editar contato" por linha, com
  todos os campos. A ficha do inbox mantém a edição inline por campo. Sem
  rota de detalhe nova.
- **Forma dos campos (provisório)**: um valor por campo, exceto `urls`
  (lista, máx. 5); `address` é texto livre; `birthday` é `YYYY-MM-DD`.
  Valor vazio (`""` ou lista vazia) apaga a chave, como já é hoje.
- **URLs só `http`/`https`**: o valor é dado do usuário e será espelhado
  no Google; um esquema como `javascript:` nunca pode entrar.
- **Permissões inalteradas**: `messaging:write` edita, `messaging:read` vê.
  `channelUserId` continua não editável.

## Escopo

- `packages/core/src/modules/contacts/**`
- `apps/web/src/server/actions/contacts.ts`
- `apps/web/src/components/contact-ficha.tsx`
- `apps/web/src/components/contact-edit-dialog.tsx`
- `apps/web/src/app/app/contacts/**`
- `apps/web/messages/pt-BR.json`
- `apps/web/e2e/**`

## Fora de escopo

- Qualquer chamada ao Google, enfileirar jobs, `metadata.google`, sync
  inicial (slice 3).
- Vários e-mails/telefones/endereços estruturados, grupos/etiquetas do
  Google, fotos (non-goals do spec).
- Rota de detalhe `/app/contacts/[id]`, busca ou colunas novas na lista por
  campos do perfil, campos extras no "Novo contato".
- Migrar dados existentes de `metadata` ou mudar o ingest dos canais.

## Tarefas

1. **Core: campos novos no perfil** — `updateContactProfileInput` ganha
   `company`, `jobTitle`, `address`, `birthday`, `urls`; o repository passa
   a tratar as chaves de forma genérica (valor vazio apaga); testes de
   validação (URL `javascript:`, data inválida, limites) e de integração.
2. **Ficha do inbox** — mostra e edita inline os campos novos
   (`FichaField`), action revalida `/app/contacts` também; i18n pt-BR.
3. **Dialog "Editar contato" em `/app/contacts`** — botão por linha, form
   com todos os campos, erros do servidor em toast; e2e no `contacts.spec`.

Checkpoint após a tarefa 1: `pnpm verify` + integração do módulo verdes
antes de tocar na UI. Cada tarefa fecha com um commit atômico.

Detalhe de acceptance + verify por task em `tasks/todo.md`.

## Riscos

| Risco                                                           | Impacto | Mitigação                                                          |
| --------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| URL com esquema perigoso entra no `metadata` e vai ao Google    | Alto    | zod só `http`/`https`; teste com `javascript:` e `data:`           |
| Campos novos somam avisos de lint (limite de linhas/statements) | Baixo   | Funções pequenas; a limpeza geral está planejada no `TODO.md`      |
| Dados pessoais novos (aniversário, endereço) viram PII extra    | Médio   | Mesma RLS e permissões; endpoints de LGPD já estão no backlog (P3) |
| Dois formulários (ficha inline e dialog) divergem em validação  | Médio   | Ambos usam a mesma action e o mesmo zod; um e2e cobre o dialog     |

## Critérios de pronto

- [x] `pnpm verify` verde
- [x] `pnpm verify:full` verde (toca o módulo de contatos e o banco): integração
      dos contatos e e2e
- [x] Testes: campo inválido rejeitado (URL `javascript:`, data, limite) e
      campo vazio apaga a chave
- [x] Docs atualizadas: `docs/product/contacts-google-sync.md` (campos
      reais), `docs/product/domain-model.md` se mudar o modelo
- [x] `TODO.md`: slice 2/3 concluída, slice 3 listada
