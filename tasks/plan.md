# Plan — Perf: etapa 3 (leituras desnormalizadas + N+1 restantes)

- **Origem**: `docs/audits/perf-baseline-2026-10-11.md` (F8, F14 + follow-up
  do F3-b em `drafts/repository.ts`) · `TODO.md` → "P2 — Perf" · PR #30 (etapa 2)
- **Lifecycle**: /spec (auditoria) ✅ → /plan → /build → /test → /review → /ship
- **Branch**: `perf/audit-etapa-3` (a partir de `main` pós-#30)
- **Data**: 2026-10-12

## Objetivo

Eliminar os subplanos correlacionados restantes do repository layer,
aproveitando as colunas desnormalizadas da etapa 2, e fechar o N+1 de
`listFunnelsWithStages` — tudo com EXPLAIN antes/depois.

## Contexto

Fatos verificados no código (main @ `4c3d8f8`):

1. **`drafts/repository.ts`** — `listNudgeCandidates` (scan periódico via
   `observer-scan.ts`) avalia `LAST_DIRECTION_SQL` + `LAST_SENT_AT_SQL`
   **no WHERE de cada linha candidata** (pior que select-list: executa
   antes do filtro reduzir). `listStaleNudges` idem por nudge pendente.
   As colunas `last_message_direction`/`last_message_at` substituem os
   dois subplanos — `lastMessageAt` já é o marcador de última mensagem
   **não-privada** (nota interna não reseta ociosidade: correção
   comportamental consistente com F3-b; hoje uma nota privada conta
   como "última mensagem" e suprime o nudge indevidamente).
   Conversação sem mensagem não-privada: `lastMessageAt` NULL → fora do
   scan (mesmo resultado do subplano antigo).
2. **F8 `listFunnelsWithStages`** (`apps/web/src/server/services.ts:160`)
   — `listFunnels` + `Promise.all(listStages × N funis)` = 1+N queries por
   render do conversation-aside. Batch `inArray(funnelId, ids)` → 2
   queries, agrupamento em memória preservando `position`.
3. **F14 `getLastInboundAt`** (`reads.ts:295`) — ordena por `created_at
desc` com filtro `direction='inbound'`; o índice existente é
   `(conversation_id, sent_at)` — não serve a `created_at`. Hipótese:
   sort da thread inteira por chamada (detail render). **Medir primeiro**;
   índice parcial só se o plano mostrar sort custoso.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

- `packages/core/src/modules/drafts/**`
- `packages/core/src/modules/leads/**`
- `apps/web/src/server/services.ts`
- `packages/db/src/schema/messaging.ts`
- `packages/db/migrations/**`

## Fora de escopo

- F5/F6 (SSE/router.refresh, widget), F7 (tx por evento no ingest),
  F9 (board sem limite — kanban precisa dos cards; reorder opera em sets
  pequenos por estágio), F13 (ILIKE) — design ou baixo risco medido.
- Mudança de contrato: `NudgeCandidate`, `FunnelWithStages`,
  `getLastInboundAt` mantêm assinaturas.

## Tarefas

### Task 1 — drafts: scan sem subplano

`listNudgeCandidates`: `LAST_DIRECTION_SQL = 'inbound'` →
`eq(conversations.lastMessageDirection, 'inbound')`;
`LAST_SENT_AT_SQL < now() - idle` → `conversations.lastMessageAt`;
`idleSince` → coluna. `listStaleNudges`: `coalesce(lastMessageDirection,
'outbound')`. Remover `LAST_MESSAGE_SQL`/`LAST_*_SQL` e o import de
`messages` se órfão.
**Verify**: typecheck; drafts int verdes.

### Task 2 — regressão do scan de nudge

Int test (service.int.test.ts ou arquivo próprio): inbound ociosa →
candidata; **nota privada por cima → ainda candidata** (falha sob a
semântica antiga); outbound pública depois → fora; sem assignee/status
errado → fora. Stale: nudge pendente com direction ≠ inbound vira stale.
**Verify**: testes novos verdes.

### Task 3 — F8: stages em batch

`leads/repository.ts`: `listStagesByFunnels(executor, organizationId,
funnelIds)` (early return em array vazio) + export no index;
`listFunnelsWithStages` em services.ts agrupa por `funnelId`.
**Verify**: typecheck; leads int verdes; 2 queries por render.

### Task 4 — F14: medir → índice condicional

Seed sintético (conversa quente ~2k msgs) + `EXPLAIN (ANALYZE, BUFFERS)`
do `getLastInboundAt` como `crm_app`. Se sort custoso: índice parcial
`(conversation_id, created_at desc) where direction='inbound'` →
`pnpm db:generate` → revisar SQL → migrar → re-EXPLAIN. Se já barato:
documentar e pular.
**Verify**: evidência registrada no relatório.

### Checkpoint

`pnpm format:check && pnpm typecheck && pnpm lint` + `pnpm test` +
`pnpm test:integration` + EXPLAINs → relatório seção I + `TODO.md` +
commits atômicos.

## Critérios de pronto

- [ ] Gate completo verde
- [ ] `listNudgeCandidates`/`listStaleNudges` sem subplano (EXPLAIN)
- [ ] Nota privada não suprime nudge — teste prova
- [ ] `listFunnelsWithStages` = 2 queries
- [ ] F14: decisão por evidência (índice ou deferral documentado)
- [ ] Relatório e TODO atualizados
