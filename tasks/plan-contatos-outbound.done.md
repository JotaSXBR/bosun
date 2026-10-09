# Implementation Plan: Contatos manuais + conversa outbound-first

## Overview

Criação manual de contatos (nome + telefone internacional → `channelUserId`
WhatsApp) e conversa outbound-first via WAHA: o agente escolhe conexão +
contato, o ticket nasce `in_progress` atribuído a ele e a 1ª mensagem sai
pelo composer. Superfícies: `/app/contacts` (lista/busca/criar/nova
conversa), dialog "Nova conversa" no inbox, "criar contato" inline no form
de deal. Extras na mesma entrega: rename `@crm/design-system` → `@crm/design-system`
e `CHANNEL_CREDENTIALS_KEY` de teste no `ci.yml`.

## Architecture Decisions

- **Módulo novo `@crm/core/contacts`** (`service`/`repository`/`schemas`/`index`,
  export `./contacts` em `packages/core/package.json`) — contatos viram
  superfície de produto própria (AGENTS.md "new domain module"). O repo do
  módulo escreve `contacts` direto (leads já lê a mesma tabela — tabelas não
  são exclusivas de módulo). `upsertContact` do messaging segue interno
  (semântica de ingest: nunca apaga nome existente); o de contacts é
  intencional (nome digitado ganha).
- **`startOutboundConversation` fica no módulo `messaging`** — é operação de
  ticket: usa `findOrCreateTicket`/`latestResolvedTicket` (internos do
  módulo). `findOrCreateTicket` ganha `assigneeId?`/`status?` no values —
  mínimo difam, ingest segue `open`/sem assignee.
- **Telefone estrito internacional**: `normalizeWhatsAppChatId(raw)` —
  aceita `+`/pontuação de formatação, exige resultado `^[1-9]\d{7,14}$`
  (DDI presente, sem prefixar 55) → `<digits>@c.us`. Erro
  `CONTACT_PHONE_INVALID`. Helper exportado pra UI validar igual.
- **Guardas do outbound**: `messaging:write`; conexão `kind='waha'` +
  `status='connected'` (senão `OUTBOUND_CHANNEL_UNSUPPORTED` /
  `CONNECTION_NOT_CONNECTED`); `contact.channelUserId` deve ser
  `*@c.us`/`*@lid` (senão `CONTACT_NOT_REACHABLE` — contato de site_chat
  tem e-mail como id). Ticket ativo existente no mesmo (conexão, chat) →
  retorna o existente (`created:false`) — UI redireciona, nunca duplica.
- **Ticket outbound**: `in_progress` + `assigneeId=ctx.userId` +
  `preceded_by_id`=último terminal do chat (mesma regra do follow-up) +
  `conversation.created` emitido quando criado. Mensagem depois pelo fluxo
  normal (`sendChannelMessage` → `waiting_customer`).
- **Permissões sem mudança**: leitura `messaging:read` (viewer incluído),
  escrita `messaging:write` (viewer negado), seletor de conexão via
  `integrations:read`. Sem migration — schema atual basta.
- **Sem envio na criação do ticket** (decisão do usuário) — então nada de
  provider no `startOutboundConversation`; e2e cobre contato+deal, ticket
  outbound é coberto por int tests (WAHA real não existe no e2e).
- **Rename primeiro**: `@crm/design-system` antes do código novo — imports
  novos já nascem certos e o diff do rename fica puramente mecânico.

## Task List

### Phase 0 — Extras (mecânicos)

- [ ] Task 1: rename `@crm/design-system` → `@crm/design-system`
- [ ] Task 2: `CHANNEL_CREDENTIALS_KEY` de teste no `ci.yml`

### Phase 1 — Core

- [ ] Task 3: módulo `@crm/core/contacts` (normalize + create + list/search)
- [ ] Task 4: `startOutboundConversation` no messaging + int tests

### Checkpoint: Core

- [ ] `pnpm --filter @crm/core test` + int do módulo verdes

### Phase 2 — App

- [ ] Task 5: services + server actions (contacts)
- [ ] Task 6: `/app/contacts` + `NewContactDialog` + nav + i18n
- [ ] Task 7: `NewConversationDialog` (inbox + contacts)
- [ ] Task 8: "criar contato" inline no `ContactSelect` do deal form
- [ ] Task 9: e2e `contacts.spec.ts`

### Checkpoint: Complete

- [ ] Gate completo: format + lint + typecheck + test + int + build (+e2e se infra)
- [ ] TODO.md → Concluído + pendências; domain-model/rules atualizados
- [ ] Review do diff → commits Conventional → push → CI verde

## Risks and Mitigations

| Risk                                                                                                             | Impact | Mitigation                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Reply do cliente cair em contato/ticket diferente (9º dígito BR — `@c.us` divergente do id canônico do WhatsApp) | Med    | Decisão registrada: sem check-canonical WAHA em v1; documentar em TODO como pendência conhecida; reconcile job já existe pra casos divergentes |
| Rename quebra algo não coberto por grep (alias dinâmico, string em config)                                       | Med    | `pnpm install` + typecheck + lint + build + showcase; grep final `@crm/design-system` = 0                                                      |
| Contato com `channelUserId` não-WhatsApp (e-mail site_chat) recebe "nova conversa"                               | Baixo  | Guard `CONTACT_NOT_REACHABLE` no service + botão desabilitado na UI                                                                            |
| Ticket outbound sem mensagem polui "Minhas"                                                                      | Baixo  | Estado válido por decisão; agente resolve ou escreve                                                                                           |
| `findOrCreateTicket` alterado afeta ingest                                                                       | Med    | Extensão só de `values` (campos opcionais); int tests de ingest existentes cobrem regressão                                                    |

## Open Questions

- Nenhuma — decisões travadas no `.task-brief.md` (Contexto).
