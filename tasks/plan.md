# Implementation Plan: Multi-atendimento slice 2 — tickets + ações

## Overview

Converter `conversations` em tickets (resolved terminal; inbound cria nova
conversa linkada por `preceded_by_id`, numeração dupla, timestamps de
métricas) e entregar as ações de atendimento (`@crm/core` service + Server
Actions, sem UI). Brief: `.task-brief.md`.

## Architecture Decisions

- **Ticket = conversation row.** Nenhuma entidade nova de episódio: a linha
  `conversations` é o ticket. Chat thread = siblings por
  `(channel_connection_id, external_id)` ordenados por `created_at`; o
  anterior direto = `preceded_by_id`. Zendesk-style: resolved imutável,
  follow-up referencia o fechado.
- **Unique parcial** `(channel_connection_id, external_id) WHERE status !=
'resolved'` — só 1 ticket ativo por chat (como Chatwoot/Zendesk). Insert
  concorrente em resolved → 23505 → reselect.
- **Contadores em tx**: `ticket_counters` (org) via upsert+RETURNING;
  `contacts.ticket_counter` via UPDATE+RETURNING. Ambos atômicos por row
  lock dentro da tx do `withTenant`.
- **Outbound fora da tx**: ler conn+creds (withTenant) → `provider.sendMessage`
  (boundary externo) → gravar message+transições (withTenant). Falha no
  provider → message `failed` persistida + DomainError (agente vê a falha).
- **Provider seam para teste**: `sendOutboundMessage` aceita dep opcional
  `{ provider }` — int test injeta `FakeChannelProvider`; produção resolve
  via `providerFromCredentials` (exportado de integrations).
- **`messaging:write`** novo no statement: owner/admin/manager/agent;
  viewer continua só read.
- Transições manuais como funções discretas (permissão/evento claros):
  `pickupConversation`, `transferConversation`, `markConversationWaiting`,
  `markConversationInProgress`, `resolveConversation`,
  `sendOutboundMessage`, `addInternalNote`, `resumeTicket`.

## Task List

### Phase 1 — Schema + ingest

- [ ] Task 1: Migração 0006 — unique parcial, colunas de ticket/métricas,
      `contacts.ticket_counter`, `ticket_counters` (RLS+FORCE+grants),
      backfill dos rows existentes; `db:generate` + revisar SQL + `db:migrate`
- [ ] Task 2: Repository + ingest — `findOrCreateTicket` (ativo ou novo com
      counters+preceded_by+sector null, retry em 23505), transição inbound só
      `waiting_customer`→`in_progress`; int tests (novo ticket em resolved,
      seqs, dedup)

### Checkpoint: Foundation

- [ ] typecheck+lint+test verdes; migração aplicada; int tests de ingest verdes

### Phase 2 — Ações

- [ ] Task 3: `messaging:write` em `@crm/permissions` (statement+roles+teste)
- [ ] Task 4: Service actions de status/assignment — pickup, transfer
      (valida setor via teams repo + membro via org_members), markWaiting,
      markInProgress, resolve (+resolved_at); eventos `conversation.updated`;
      `listTenantConversations` ganha `view` (queue = open + assignee null,
      mais antigo esperando primeiro via last inbound; mine = assignee self;
      resolved); int tests (transições + permissões + RLS + view)
- [ ] Task 5: `sendOutboundMessage` + `addInternalNote` + `resumeTicket` —
      helper `providerForConnection` exportado de integrations; outbound
      →waiting_customer+auto-assign+first_response_at; nota privada; resume
      cria ticket linkado; int tests com `FakeChannelProvider`

### Checkpoint: Domain

- [ ] int tests verdes (transições, outbound fake, nota, resume, RLS,
      viewer negado)

### Phase 3 — Actions + docs

- [ ] Task 6: `apps/web/src/server/actions/messaging.ts` — wrappers
      `{ok}|{ok:false,error}` (pattern integrations.ts) + revalidatePath
- [ ] Task 7: Docs — domain-model/rules refletem tickets (resolved
      terminal, preceded_by, numeração, métricas); TODO.md

### Checkpoint: Complete

- [ ] `pnpm format:check && pnpm typecheck && pnpm lint && pnpm test` +
      `pnpm test:integration` verdes; critérios do brief cumpridos

## Risks and Mitigations

| Risk                                                        | Impact | Mitigation                                                                           |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| drizzle-kit não gera unique parcial/data migration          | Med    | Revisar SQL à mão como na 0005 (backfill + DROP INDEX + CREATE UNIQUE ... WHERE)     |
| Send provider ok, write tx falha → msg enviada sem registro | Med    | Aceitar v1 (raro); nota em código; reconciliação via `message.status` webhook depois |
| Concorrência inbound vs resolved                            | Low    | Unique parcial + retry/reselect em 23505 dentro da mesma tx                          |
| `providerFromCredentials` privado                           | Low    | Exportar de integrations como helper interno (sem mudar contrato)                    |

## Open Questions

- Nenhuma — decisões travadas no brief (Zendesk-style).
