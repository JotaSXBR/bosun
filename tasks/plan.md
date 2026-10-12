# Plan — Perf: correções da auditoria 2026-10-11

- **Origem**: `docs/audits/perf-baseline-2026-10-11.md` (F1–F4, F10, F11) ·
  `TODO.md` → "P2 — Perf: crescimento dos reads quentes"
- **Lifecycle**: /spec (auditoria) ✅ → /plan → /build → /test → /review → /ship
- **Data**: 2026-10-11

## Objetivo

Eliminar os gargalos confirmados por plano de execução nos reads quentes
(inbox, contatos, widget/ingestão) e corrigir dois suspeitos funcionais,
sem alterar contratos de API nem o isolamento por tenant.

## Contexto

Decisões do gate de esclarecimento (2026-10-11):

1. **F10/F11 entram**: `listMessages` passa a retornar as **últimas N**
   mensagens em ordem cronológica (hoje: as primeiras N — threads >100
   msgs não mostram as recentes); página de contatos ganha paginação
   (`?page=`) porque só os primeiros 50 eram alcançáveis.
2. **F2**: índice `conversations(channel_connection_id, external_id,
created_at desc)` — migration nova via `pnpm db:generate`, revisada
   antes de `pnpm db:migrate` local; validação com EXPLAIN antes/depois.
3. **F3**: etapa (a) da auditoria — um único lookup da última mensagem
   por linha (LATERAL join compartilhando direction+preview+filtro),
   eliminando 2 dos 3 subplanos; a desnormalização (b) fica para outro
   plano.
4. **F4**: dedup por request via React `cache` — `requireTenantContext`,
   `getConversation`, busca de conexões (derivada para waha/connected) e
   `listTeams`. Envelope transacional por query simples NÃO muda (decisão
   de design — revisitar separado se houver sinal).
5. F5/F6/F7/F8/F9/F13/F14/F15 ficam fora — design maior, não confirmados
   ou baixo impacto (registrados na auditoria e no TODO).

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

- `packages/core/src/modules/contacts/**`
- `packages/core/src/modules/messaging/**`
- `packages/db/src/schema/messaging.ts`
- `packages/db/migrations/**`
- `apps/web/src/server/**`
- `apps/web/src/app/app/contacts/**`
- `apps/web/messages/**`

## Fora de escopo

- `inbox-live.tsx` / SSE / `subscribeDomainEvents` (F5/F6 — design).
- Pipeline de ingestão multi-evento (F7).
- `listFunnelsWithStages`, board/moves (F8/F9).
- `getLastInboundAt`, busca ILIKE, imagens/frontend (F13–F15).
- Desnormalização de preview/direction em `conversations` (F3-b).
- Qualquer mudança em `withTenant`/`withPlatformScope` ou no pool.

## Tarefas

### Task 1 — F1: `listContacts` com LEFT JOIN + GROUP BY

Substituir o count correlacionado por join agrupado. Preservar filtro,
ordenação, limit/offset e tipo de retorno.
**Verify**: `service.int.test.ts` de contacts + EXPLAIN (B3) sem Seq Scan
por linha.

### Task 2 — F3: inbox com UM lookup de última mensagem por linha

`LEFT JOIN LATERAL` (ou equivalente) retornando `direction` + `preview` —
usado tanto nos campos quanto no filtro `awaitingReply` (sem 3ª
avaliação). Preservar ordem nulls last/tiebreak e views.
**Verify**: `inbox-views.int.test.ts` + `reads.int.test.ts` verdes;
EXPLAIN (B1/B2) com 1 subplano.

### Task 3 — F10: `listMessages` retorna as últimas N

Desc + reverse (espelhando `listRecentMessages`) mantendo joins,
reactions/quotes batched e redaction por papel.
**Verify**: `reads.int.test.ts`, `outbound.int.test.ts`, `message-views`
verdes + novo caso cobrindo janela >limit.

### Checkpoint A

`pnpm typecheck && pnpm lint` + testes alvo dos módulos.

### Task 4 — F2: índice `(channel_connection_id, external_id, created_at desc)`

Schema → `pnpm db:generate` → revisar SQL → `pnpm db:migrate` local.
**Verify**: EXPLAIN (B4/B5) usando o índice novo; suite int. verde.

### Task 5 — F4: dedup por request

`cache()` em `requireTenantContext` (tenant.ts); em services.ts, fetch
único de `listChannelConnectionsForTenant` compartilhado por
`listWahaConnections`/`listConnectedChannels`, `cache` em
`getConversation` e `listTeams`.
**Verify**: typecheck/lint; comportamento idêntico (redirect paths).

### Task 6 — F11: paginação em `/app/contacts`

`?page=` (1-based) → offset; links Anterior/Próxima preservando `q`.
Sem componente novo — links simples na página.
**Verify**: typecheck/lint; lista muda de página com >50 contatos.

### Checkpoint B

Gate completo + re-rodar `perf-baseline-2026-10-11.sql` e registrar
antes/depois no relatório da auditoria + `TODO.md`.

## Critérios de pronto

- [ ] `pnpm format:check && pnpm typecheck && pnpm lint` verdes
- [ ] Testes alvo: `*.int.test.ts` de contacts e messaging (+ unitários)
- [ ] EXPLAIN B1–B5 re-executados: 1 subplano no inbox, sem Seq Scan em
      conversations nos lookups B3–B5
- [ ] Antes/depois anotado no relatório de auditoria
- [ ] `TODO.md` atualizado
