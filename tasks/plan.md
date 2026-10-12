# Plan — Perf: etapa 2 (F3-b denormalização do último mensagem)

- **Origem**: `docs/audits/perf-baseline-2026-10-11.md` (F3-b) ·
  `TODO.md` → "P2 — Perf: crescimento dos reads quentes" · PR #29 (etapa 1)
- **Lifecycle**: /spec (auditoria) ✅ → /plan → /build → /test → /review → /ship
- **Branch**: `perf/audit-etapa-2` (a partir de `main` pós-#29)
- **Data**: 2026-10-12

## Objetivo

Eliminar por completo o subplano correlacionado de última mensagem no
read quente do inbox (`listConversations`), materializando
`last_message_preview` + `last_message_direction` em `conversations` —
escritos no mesmo ponto que já atualiza `last_message_at`.

## Contexto

Decisões já tomadas na etapa 1 e fatos verificados no código:

1. `updateConversationLastMessage` tem **3 call sites**, todos com o
   conteúdo da mensagem em mãos: ingest inbound (`service.ts:114`),
   outbound (`outbound.ts:130`), off-hours auto-reply (`offhours.ts:304`).
2. Mensagens `private` (notas internas, system notes) **não** chamam
   `updateConversationLastMessage` — já não movem `last_message_at`.
   O subplano atual, porém, as conta como "última mensagem": hoje uma
   nota interna polui o preview e limpa `awaitingReply`. A
   desnormalização alinha preview/direction a `last_message_at` —
   **correção comportamental intencional** (nota interna não apaga o
   indicador de "aguardando resposta" nem vaza no preview da fila).
3. Edição/revogação (`applyMessageEdit`, `markMessageRevoked`) são paths
   raros com provider call no meio — recebem um refresh correlacionado
   para manter paridade (hoje o subplano mostra texto editado; revogação
   mantém conteúdo original — não filtrar `revokedAt` no refresh).
4. Replay de webhook dedupado chama `updateConversationLastMessage`
   mesmo sem insert (linha 114 antes do `if (!message)`) — reescrever os
   mesmos valores é idempotente, sem ação extra.
5. `messages.direction` é CHECK `('inbound','outbound')` — domínio de 2
   valores; `awaitingReply` vira `direction = 'inbound'` na coluna.
6. Backfill usa `DISTINCT ON (conversation_id)` sobre mensagens
   **não-privadas**, mesma ordenação do antigo subplano
   (`sent_at desc nulls last, created_at desc`).

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

- `packages/db/src/schema/messaging.ts`
- `packages/db/migrations/**`
- `packages/core/src/modules/messaging/**`

## Fora de escopo

- F5/F6 (SSE/router.refresh), F7–F9, F13–F15 — design/outros módulos.
- Mudança de UI/contrato: `ConversationListRow` mantém os mesmos campos.
- Índices novos — nenhum necessário (colunas são lidas, não filtradas;
  o filtro `awaitingReply` já anda junto do status).

## Tarefas

### Task 1 — schema + migration com backfill

`conversations.last_message_preview text`, `last_message_direction text`
→ `pnpm db:generate` → acrescentar `UPDATE` de backfill (DISTINCT ON,
`private is not true`, mesma ordenação) no arquivo gerado →
`pnpm db:migrate` local.
**Verify**: colunas populadas; EXPLAIN B1 sem subplano ao final.

### Task 2 — write path

`updateConversationLastMessage` passa a receber `{direction, preview}`;
helper `messagePreviewText(content)` (text ?? caption ?? `[type]` —
mesma coalesce do SQL antigo); 3 call sites atualizados.
**Verify**: typecheck; int tests de ingest/outbound/offhours verdes.

### Task 3 — refresh em edit/revoke

`refreshConversationLastMessage(tx, conversationId)`: UPDATE
correlacionado (não-privadas, sem filtro de revokedAt) chamado após
`applyMessageEdit` e `markMessageRevoked`.
**Verify**: message-actions int tests verdes.

### Task 4 — reads sem subplano

`listConversations` lê as colunas direto; filtro `awaitingReply` vira
`eq(coluna, 'inbound')`; remover `LAST_MESSAGE_SQL`/`LAST_MSG_DIRECTION_SQL`;
map mantém `lastMessagePreview`/`awaitingReply` no tipo.
**Verify**: inbox-views + reads int verdes; EXPLAIN B1/B2 zero subplanos.

### Task 5 — teste da correção comportamental

Int test: `addInternalNote` não apaga `awaitingReply` nem muda o preview.
**Verify**: teste novo verde (falharia sob a semântica antiga).

### Checkpoint

`pnpm format:check && pnpm typecheck && pnpm lint` + `pnpm test` +
`pnpm test:integration` + EXPLAIN B1/B2 → relatório seção I atualizada

- `TODO.md` + commits atômicos.

## Critérios de pronto

- [ ] Gate completo verde
- [ ] EXPLAIN B1: 0 subplanos (scan+sort direto)
- [ ] Preview/direction denormalizados idênticos ao subplano antigo
      (exceto correção intencional das notas privadas)
- [ ] Relatório e TODO atualizados
