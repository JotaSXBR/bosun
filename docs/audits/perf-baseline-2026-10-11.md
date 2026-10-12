# Auditoria de performance — baseline 2026-10-11

- **Repo:** bosun @ `433fb3e` (`feat/ux-7-leis`), working tree limpo no início.
- **Modo:** auditoria somente-leitura. Nenhum código de produção, dependência,
  migration ou CI foi alterado. Artefatos novos: este relatório +
  `perf-baseline-2026-10-11.sql` (seed sintético + planos reproduzíveis).
- **Ambiente de medição:** Docker local `bosun-*` (Postgres 18
  `pgvector/pgvector:0.8.7-pg18-trixie`, Redis, RustFS), Node v24.21.0,
  pnpm 12.8.1, Windows. Queries executadas como `crm_app` (role com RLS) com
  `app.organization_id` setado — mesmo caminho de `withTenant`.
- **Dataset sintético:** 1 org, 1 conexão, 200 contatos, 200 conversas
  (150 open/fila, 30 resolved, 20 closed), 5.000 mensagens (1 conversa
  "quente" com 2.020). Removido após a medição. Cache quente (shared buffers).

## A. Resumo executivo

A camada de acesso a dados é disciplinada: joins em vez de N+1 na maior parte,
`Promise.all` no nível de página, contadores em scan único, writes com
idempotência e eventos `pg_notify` na mesma transação. Os riscos reais são de
**crescimento**: três consultas do caminho quente (inbox, contatos, widget/
ingestão) têm custo proporcional a volumes que só crescem com o tempo
(mensagens por conversa, total de conversas da org). Nenhuma é gargalo hoje —
os dados seed são minúsculos — mas os planos medidos mostram a forma do
problema. O segundo tema é **amplificação por request**: cada página monta
~18–22 queries com envelope de transação (BEGIN + set_config + COMMIT) por
chamada, e cada evento de domínio dispara `router.refresh()` que re-executa o
grafo inteiro por cliente conectado.

Principais achados (detalhe na seção D):

| #   | Achado                                                                                                         | Status                                                           | Impacto esperado                             |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| F1  | `listContacts`: count correlacionado por linha, sem índice em `conversations.contact_id`                       | confirmado (plano medido)                                        | cresce com conversas da org                  |
| F2  | `latestResolvedTicket` / `findLatestConversationForChat`: Seq Scan de **todas** as conversas da org por lookup | confirmado (plano medido)                                        | cresce com conversas da org                  |
| F3  | Inbox: 2 subplanos por linha varrem **todas** as mensagens da conversa                                         | confirmado (medido: 4,6ms/534 buffers com 1 conversa de 2k msgs) | cresce com mensagens por conversa            |
| F4  | ~18–22 queries + envelope transacional por página do inbox; queries duplicadas por render                      | confirmado (análise)                                             | latência por request, churn do pool (max=10) |
| F5  | `router.refresh()` por evento de domínio → re-execução do grafo inteiro por cliente                            | confirmado (design)                                              | multiplica F1–F4 por evento/cliente          |
| F10 | `listMessages` retorna as **100 mais antigas**; conversas longas não mostram as novas                          | suspeito funcional                                               | correção > performance                       |
| F11 | Página de contatos sem paginação: só os primeiros 50 são alcançáveis                                           | suspeito funcional                                               | correção > performance                       |

Limitações: sem RUM, sem profiling do bundle em produção, sem teste de carga
HTTP (exigiria subir o app com jobs — pg-boss inicia no boot e dispara sweeps;
integrações externas não configuradas localmente, então o risco externo é
baixo, mas a janela não justificou). Medições de banco são cache-quente em
dataset sintético — evidência de _forma de plano e contagem de buffers_, não
de latência de produção.

## B. Stack e escopo examinado

Next.js 16.3.8 (App Router, tudo `force-dynamic`), React 19.3, TS 6.0.3,
Drizzle 0.45.3 sobre `postgres.js` 3.4.9 (pool default max=10), pg-boss
12.35 in-process, Better Auth 1.7.7, next-intl 4.14.9, Tailwind 4.3,
Vitest 5.0.3. Monorepo pnpm/Turbo; `pnpm test` = 167 testes unitários, **verde**.

Fluxos escolhidos (critério: caminho quente + relações aninhadas + listas
crescentes + superfície pública):

1. **Inbox `/app/inbox?c=`** — tela principal; lista + detalhe + aside.
2. **Contatos `/app/contacts`** — lista crescente com agregado por linha.
3. **Widget público** (`session`, `messages`, `stream`) — não autenticado,
   resolve por token; polls frequentes.
4. **Ingestão de webhook** (`POST /api/webhooks/channels/[token]`) — write
   path mais frequente; por evento em payload.
5. **Deals `/app/deals`** — board com relações; drag reordena.

Não medido: E2E Playwright, Lighthouse, k6 (justificativa na seção A).

## C. Baseline

Unit: `pnpm test` → 22 arquivos / 167 testes, verde em 8,1s.
Banco: planos `EXPLAIN (ANALYZE, BUFFERS)` no dataset sintético (script na
seção E). Tempos são ms em cache quente — o que importa é **loops, buffers e
forma do plano**.

| Fluxo                              | Métrica        | Baseline         | Condições                       | Evidência                                                                  | Limitação                     |
| ---------------------------------- | -------------- | ---------------- | ------------------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| Inbox (queue, limit 50)            | exec / buffers | 2,6 ms / 379 hit | 150 convs na fila, msgs 20/conv | SubPlan 1 e 2: Index Scan + Sort, **loops=50 cada, 100 index searches**    | cache quente; dataset pequeno |
| Inbox (view all, hot conv)         | exec / buffers | 4,6 ms / 534 hit | +1 conversa com 2.020 msgs      | subplanos varrem todas as msgs da conversa (rows=60 médio × 50 × 2)        | idem                          |
| Contatos (limit 50)                | exec / buffers | 1,3 ms / 457 hit | 200 contatos, 215 convs         | SubPlan: **Seq Scan em conversations loops=50** (~10.750 linhas visitadas) | escala com convs da org       |
| latestResolvedTicket               | plano          | 0,056 ms         | 215 convs                       | **Seq Scan** (índice parcial não cobre status terminais)                   | sem índice utilizável         |
| findLatestConversationForChat      | plano          | 0,064 ms         | idem                            | **Seq Scan** (widget: por poll)                                            | idem                          |
| findActiveTicket                   | plano          | Index Scan       | seqscan off                     | índice parcial **é** utilizável em escala                                  | OK                            |
| Contadores inbox (6 views)         | plano          | 1 scan           | —                               | Aggregate único, correto                                                   | OK                            |
| Queries por render `/app/inbox?c=` | contagem       | ~18–22           | análise estática                | ver F4                                                                     | não medido em HTTP            |

## D. Achados priorizados

### F1 — Contatos: contagem por linha sem índice (confirmado)

`packages/core/src/modules/contacts/repository.ts:74-77` — `(select count(*)
from conversations where contact_id = c.id)` por contato; não existe índice
em `conversations.contact_id` (FK sem índice no lado referenciador). Plano
medido: Seq Scan de conversations **por linha** (loops=50). Custo
O(page_size × org_conversations).
**Recomendação:** reescrever como `LEFT JOIN conversations GROUP BY
contacts.id` (uma passada, sem índice novo) — mais simples e sem custo de
escrita. Alternativa: índice `conversations(contact_id)` se o lookup por
contato aparecer em outros fluxos. **Validação:** EXPLAIN antes/depois +
teste int. comparando resultado.

### F2 — Lookups por (connection, external_id) sem índice não-parcial (confirmado)

`repository.ts:92-110` (`latestResolvedTicket`, por inbound em chat
resolvido) e `:336-353` (`findLatestConversationForChat`, por poll do widget
e attach do stream). O índice único **parcial**
`conversations_connection_external_idx` exclui resolvidas — para essas duas
queries não existe índice utilizável: Seq Scan de todas as conversas da org
(RLS limita à org, não à conexão). `findActiveTicket` está OK — medido que o
índice parcial serve quando a tabela cresce.
**Proposta de índice** (não aplicada):
`conversations(channel_connection_id, external_id, created_at desc)` —
não-parcial. Cobre os dois lookups; sobrepõe-se parcialmente ao único
parcial existente (custo de escrita: mais um índice em tabela quente de
inserts — aceitável, mas deve ser ponderado). **Validação:** re-rodar B4/B5
do script após criar o índice num banco descartável.

### F3 — Inbox: 2 subplanos por linha varrendo todas as mensagens da conversa (confirmado)

`reads.ts:127-130` — `lastMessagePreview` e `LAST_MSG_DIRECTION_SQL` são duas
subqueries correlacionadas avaliadas **por linha**, cada uma lendo todas as
mensagens da conversa (o tiebreak `created_at desc` impede o índice de
ordenar) + sort. Filtro `awaiting=1` adiciona uma 3ª avaliação. Medido: 50
linhas → 100 index searches; conversa de 2.020 msgs → buffers 379→534. Custo
por página ≈ 2 × Σ(mensagens das conversas listadas) — sem limite superior
enquanto threads crescem.
**Recomendação em etapas:** (a) curto prazo — `LEFT JOIN LATERAL` único
retornando direção + preview (metade do custo); (b) estrutural —
desnormalizar `last_message_preview`/`last_message_direction` em
`conversations` no ingest (a escrita já atualiza `last_message_at` na mesma
tx — custo ~zero) eliminando os subplanos; (c) alternativa de índice
covering `(conversation_id, sent_at desc, created_at desc) include
(direction, content)` — pesada em storage/escrita, não recomendada primeiro.
**Validação:** re-rodar B1/B2; equivalência dos campos por teste int.

### F4 — Envelope transacional por chamada + queries duplicadas por render (confirmado, análise)

Toda chamada de serviço abre `db.transaction()` + `set_config` — mesmo para
um SELECT único (→ ≥4 round-trips por chamada). Em `/app/inbox?c=`:
`getConversation` roda 2× (pane + aside), `listTeams` 2× (page + pane),
`listChannelConnectionsForTenant` 2× (`listWahaConnections` +
`listConnectedChannels` filtram a mesma lista em memória),
`requireTenantContext` → `getMembership` ~3× (não é `cache`ado, ao contrário
de `getSession`). Pool postgres.js default `max=10`; cada `withTenant`
segura uma conexão pela transação — 5 `Promise.all` do page-level usam até
5 conexões simultâneas **por request**, e `Promise.all` _dentro_ de uma tx
(`listMessages`, `getBoard`) não paraleliza: postgres.js serializa na mesma
conexão (ilusão inócua, mas registra a intenção correta).
**Recomendação:** `cache()` em `requireTenantContext` e em `getConversation`
por request; uma única busca de conexões derivada 2×; considerar read-path
sem transação para SELECTs únicos somente-leitura (mudança de design —
`set_config` local requer tx; avaliar `set_config(..., false)` com sessão
dedicada por request). **Validação:** contagem de queries por render.

### F5 — `router.refresh()` por evento de domínio (confirmado, design)

`inbox-live.tsx:52` — cada evento (exceto `contact.presence`) re-renderiza a
rota inteira após 500ms de debounce → re-executa o grafo de F4 em **todos**
os clientes abertos. Rajada de mensagens = refresh contínuo.
**Recomendação:** debounce mais longo/coalescer, ou invalidação mirrada
(futuro: refetch só da lista/ticket). Nota: correto funcionalmente; é
amplificador de carga, não bug.

### F6 — Widget: write por leitura + conexão dedicada por visitante (suspeito)

`resolveWidgetSession` (`sitechat.ts:110-120`) executa
`touchSiteChatSession` (UPDATE) em todo resolve — inclusive polls de
histórico e attach do stream (rate-limit 60/min/token). Cada visitante do
widget e cada aba de agente = 1 conexão LISTEN dedicada (documentado em
`realtime.ts` — decisão consciente; NOTIFY é filtrado client-side, então todo
evento da instância atravessa toda conexão). OK na escala atual; registrar
limite conhecido.

### F7 — Ingestão: uma transação por evento do payload (suspeito)

`service.ts:349-354` — `for ... await withTenant(...)` por evento. Webhook
com N eventos = N envelopes sequenciais. Deliberado para ordenação/isolamento
de falha; só viraria gargalo com payloads grandes. Hipótese, não medido.

### F8 — `listFunnelsWithStages`: 1+N queries paralelas (suspeito, baixo)

`services.ts:150-152` — uma query `listStages` por funil (paralelas).
Funis/org são poucos; candidato a join único se crescer.

### F9 — Board sem limite + reordenação N-update (suspeito, baixo)

`listBoardDeals` retorna todos os deals do funil; `moveDeal`
(`deals.ts:144-156`) reescreve posições com um UPDATE por deal na etapa —
sequencial, dentro de uma tx. Pequeno hoje; observar quando boards tiverem
centenas de cards. KanbanBoard recebe o board inteiro como props (payload
cresce com deals).

### F10 — `listMessages` retorna as mensagens **mais antigas** (suspeito funcional)

`reads.ts:192-193` — `orderBy(sentAt)` ASC + `limit` (default 100) →
primeiras 100 mensagens; conversas >100 msgs não exibem as recentes e a UI
não tem paginação. Compare com `listRecentMessages` (desc + reverse) usada
por jobs. **Verificar intenção** — se o esperado é "últimas N", é bug
funcional além de volume.

### F11 — Contatos sem paginação na UI (suspeito funcional)

A query aceita limit/offset (default 50), mas a página nunca envia offset —
contatos além dos 50 primeiros são inalcançáveis.

### F12 — Jobs pg-boss: serial por fila (não-problema, registrado)

`work()` sem opções → `batchSize=1`, `localConcurrency=1` (defaults do
pg-boss 12.35); o `for await` sequencial por job é coerente. Teto de
throughput por fila existe; LLM jobs rodam no mesmo event-loop do Next —
aceitável enquanto a carga for baixa (ADR 0016).

### F13 — Busca `ILIKE '%…%'` (não aplicável hoje / observação)

`reads.ts:66-70` e contacts — coringa inicial inviabiliza btree; dentro do
escopo da org (RLS) o scan é sobre fatia pequena. Se busca ficar lenta com
conversas grandes: `pg_trgm` + GIN. Sem ação agora.

### F14 — `getLastInboundAt` ordena todas as msgs da conversa (suspeito, baixo)

`reads.ts:292-310` — `direction='inbound' order by created_at desc` não tem
índice que cubra (sort de toda a conversa). Usado por render de drafts.
Índice candidato só se F3-b não eliminar a necessidade.

### F15 — Imagens/frontend (pouco relevante hoje)

Quase sem imagens: `public/` só tem `widget.js`. `message-item.tsx` usa
`<Image unoptimized width={0} height={0}>` para mídia de chat — não reserva
espaço (CLS na thread) e `/api/media/[id]` tem `cache-control: private,
max-age=300` → refetch a cada 5min por imagem renderizada; mídia de
provedor é baixada a cada request de mídia (sem cache server-side).
LCP/INP/CLS não medidos (sem build servido); 3 Google Fonts via `next/font`
(self-hosted, OK). Sem `loading=lazy` customizado — thread longa com muitas
imagens baixa tudo de uma vez (`/api/media` por imagem, autenticado).

### Positivos verificados

Promise.all correto no nível de página; reactions/quotes em 2 queries
batched; contadores em scan único; índice parcial único do ticket ativo
serve em escala; provider call **fora** da tx (documentado em outbound.ts);
eventos `pg_notify` na mesma tx; idempotência por índices únicos parciais;
rate-limit nos endpoints públicos; RLS em todas as tabelas tenant.

## E. Reprodução

```bash
git checkout 433fb3e            # opcional — estado auditado
pnpm infra:up && pnpm db:migrate
docker exec -i bosun-postgres-1 psql -U crm -d crm \
  < docs/audits/perf-baseline-2026-10-11.sql
pnpm test                        # gate funcional: 167 testes
```

Arquivos novos criados nesta auditoria:

- `docs/audits/perf-baseline-2026-10-11.md` (este relatório)
- `docs/audits/perf-baseline-2026-10-11.sql` (seed sintético + planos B1–B5)

## F. Plano de correções (mudanças pequenas e independentes)

1. **F1** — reescrever `listContacts` com LEFT JOIN + GROUP BY. Risco baixo;
   equivalência por teste int existente + EXPLAIN.
2. **F3-a** — lateral join único para preview+direction (ou F3-b
   desnormalização, com migration própria). Risco médio; mexe na query mais
   lida.
3. **F2** — índice `(channel_connection_id, external_id, created_at desc)`
   via migration própria; validar com B4/B5.
4. **F4** — `cache()` por request em `requireTenantContext`/`getConversation`;
   dedup da busca de conexões. Risco baixo.
5. **F10/F11** — confirmar intenção com o dono do produto antes de codar
   (possível bug funcional, não apenas perf).
6. **F5/F6** — design: refresh mirrado/coalesced; revisar write-per-poll do
   widget quando houver sinal de carga.

Cada item: implementar isolado → `pnpm typecheck && pnpm lint` + testes do
módulo → re-rodar o script SQL correspondente → reportar antes/depois com
buffers e loops, não só tempo.

## G. Testes de regressão propostos

- **Gate estrutural anti-N+1:** wrapper de `DbExecutor` contando statements
  por chamada em `*.int.test.ts` — ex.: `listConversations`, `listContacts`,
  `listMessages` devem executar ≤ K queries independente do nº de linhas
  (K = contagem atual documentada). Estável e não depende de tempo.
- **Gate de plano (opcional, CI com infra):** `EXPLAIN` de B3/B4/B5 assert
  `Seq Scan on conversations` ausente onde houver índice esperado —
  frágil a mudanças de estatística; preferir o gate de contagem.
- **Latência:** se adotado, medir p50/p95 do service em loop (ex.: 50 runs,
  warm) com orçamento provisório — ex.: inbox ≤ X ms em dataset sintético
  de referência; marcar como provisional budget até haver SLO.
- Sem budget/SLO definido hoje — metas acima são propostas a validar.

## H. Fontes

- Código-fonte do repo (arquivos citados por caminho:linha acima).
- `EXPLAIN (ANALYZE, BUFFERS)` em PostgreSQL 18 local.
- Defaults pg-boss 12.35 lidos em `pg-boss/dist/manager.js` +
  `types.d.ts` (`batchSize=1`, `localConcurrency=1`).
- postgres.js: pool default `max=10` (lib 3.4.9).
- Docs oficiais consultadas por conhecimento: PostgreSQL partial/multicolumn
  indexes, pg-boss work options. Nenhuma feature de versão nova proposta sem
  suporte instalado.

## I. Correções aplicadas (etapa 1 — 2026-10-11)

Implementado sob `tasks/plan.md` após aprovação. Mesma base, mesmo dataset
sintético, `EXPLAIN (ANALYZE, BUFFERS)` re-executado nas formas finais.

| Achado        | Mudança                                                                                                                                          | Verificação                                    | Depois (mesmo dataset)                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 contatos   | `listContacts`: count correlacionado → `LEFT JOIN ... GROUP BY`                                                                                  | `service.int.test.ts` +8º caso (offset)        | 1 scan+HashAggregate, ~0,55 ms/pág (era 50 subplanos Seq Scan)                                                                                              |
| F2 lookups    | `conversations(channel_connection_id, external_id, created_at desc)` — migration `0025_pretty_mother_askani`                                     | `pnpm db:migrate` + EXPLAIN B4/B5              | Index Scan no índice novo, 0,06–0,13 ms (era Seq Scan)                                                                                                      |
| F3 inbox      | 2 escalares → 1 subplano `jsonb_build_object` em select-list (avaliado só nas 50 linhas de saída); filtro `awaitingReply` mantém escalar próprio | `inbox-views`/`reads` int                      | B1: 50 index searches, 205 buffers (era ~100); B2: 200 probes (era ~250). **Tentativa LATERAL descartada — medida pior (150 loops, join avalia pré-LIMIT)** |
| F4 dedup      | `cache()` em `requireTenantContext`, `getConversation`, `listSectors` e fetch único de channel connections                                       | typecheck + suite                              | ~5–7 queries a menos por render do inbox                                                                                                                    |
| F10 mensagens | `listMessages`: DESC + `LIMIT` + reverse em memória (últimas N, ordem cronológica)                                                               | novo caso janela >limit em `reads.int.test.ts` | contrato corrigido                                                                                                                                          |
| F11 contatos  | `listContactsPage` aceita `ListContactsInput`; `/app/contacts?page=` com links Anterior/Próxima (`limit+1` p/ hasNext)                           | novo caso offset em `service.int.test.ts`      | páginas >50 alcançáveis                                                                                                                                     |

Gate final: `pnpm typecheck` 14/14 · `pnpm lint` 0 erros (125 warnings
pré-existentes) · `pnpm test` 167/167 · `pnpm test:integration` 260/260
(42 arquivos). `format:check` verde.

Sem claim de ganho percentual em latência de usuário: números são de
plano/execução em cache quente num dataset sintético local — evidência de
forma de plano e buffers, não de produção.
