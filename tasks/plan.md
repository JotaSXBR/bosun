# Implementation Plan: Multi-atendimento slice 5 — pg-boss, auto-reply, `closed`

## Overview

Fecha o item P1 multi-atendimento (brief `.task-brief.md`, aprovado
2026-10-06): três entregas acopladas —

1. **Camada de jobs real**: pg-boss in-process substituindo Trigger.dev
   por completo (decisão 2026-10-04 executada de fato): os 2 tasks do
   `@crm/automation` viram handlers, `@trigger.dev/*` sai do repo, schema
   `pgboss` criado por migration (owner role) com grants para `crm_app`,
   boot no `register()` do instrumentation (só runtime nodejs).
2. **`closed` materializado**: migration adiciona o status e corrige o
   partial unique index (`!= 'resolved'` → `not in ('resolved','closed')`);
   sweep agendado (`*/15 * * * *`) fecha tickets `resolved` cuja janela de
   reabertura expirou (per-org via `organization_settings`).
3. **Auto-reply fora de horário**: dentro do job `process-channel-event`
   (fan-out já documentado), 1×/conversa/dia org-local, só com
   `offHoursMessage` preenchido e fora das `businessHours.windows`,
   `{proximo_atendimento}` interpolado — send path de sistema que não toca
   status/assignee do ticket.

## Architecture Decisions

- **pg-boss roda no processo web** (`instrumentation.ts` → `startJobs()`):
  sem worker separado — ADR 0010 é substituído por ADR 0016 mantendo "no
  `apps/worker`". pg-boss é multi-instance-safe (locks no Postgres).
- **Schema `pgboss` via migration, não via `boss.start()`**: migrations
  rodam como owner (`DATABASE_ADMIN_URL`); a app roda como `crm_app`
  (nosuperuser, sem CREATE SCHEMA). `PGBoss.getConstructionPlans("pgboss")`
  gera o DDL → migration custom + `GRANT` para `crm_app`; boot usa
  `migrate: false`. Upgrade de pg-boss = regerar plans numa nova migration.
- **Enqueue transacional**: `boss.send(name, data, { db })` aceita adapter
  (`{ executeSql(text, values) }`) — implementamos um sobre a drizzle tx
  (`tx.$client.unsafe`). O enqueue de `process-channel-event` move para
  **dentro** da tx de ingest: `ingestChannelWebhook(db, token, body, deps)`
  recebe `deps.enqueue(tx, name, payload)` injetado pelo route (core nunca
  importa `@crm/automation` — respeita app → providers → core → db).
  Fallback: se o adapter falhar no design, enqueue pós-commit + doc do gap.
- **Send path de sistema para auto-reply**: função própria em core
  messaging (`offhours.ts`) — `providerForConnection` + `insertMessage`
  outbound com `authorId: null` + `metadata.system: "off_hours_reply"`,
  `updateConversationLastMessage`, `emitDomainEvent` — sem `patchTicket`
  (auto-reply não pode roubar ticket nem virar `waiting_customer`).
- **Dedup 1×/dia**: query por última message com o marcador
  `metadata->>system` na conversa no dia org-local corrente
  (`timezone` da settings via `at time zone` ou cálculo em JS puro).
- **Sweep `closed`**: `withServiceAccess` (mesmo mecanismo do webhook —
  job não tem tenant próprio): SELECT orgs com resolved expirados → por
  org `withTenant` UPDATE + `emitDomainEvent` por linha (SSE consistente).
- **`loadActiveTicket` rejeita `closed`** com o mesmo DomainError
  (`TICKET_RESOLVED` — closed é resolved + janela expirada; mensagem já
  correta). `reopenTicket` já rejeita (`status !== "resolved"`).
  `resumeTicket` passa a aceitar fonte `closed` (provisório: agente precisa
  reabrir conversa com cliente após a janela — mesmo caminho auditado).
- **Views**: `mine`/`!= 'resolved'` → `not in ('resolved','closed')`;
  `resolved` view → `inArray(["resolved","closed"])` (histórico único);
  `inbox`/`queue` inalterados. Badge "Encerrada" na UI do inbox.
- **Semântica `windows` vazio** (provisório): nenhum dia configurado =
  sempre fora de expediente; o gate real do auto-reply é `offHoursMessage`
  não-vazio. `{proximo_atendimento}` sem janelas computáveis → "em breve".

## Task List

### Phase 1: Jobs layer

- [x] Task 1: pg-boss foundation — dep `pg-boss`, `boss.ts` (start/singleton + adapter `executeSql` sobre drizzle tx), migration com
      `getConstructionPlans` + grants `crm_app`, boot em `register()` com
      `createQueue` das 3 filas + `work`/`schedule` wiring.
- [x] Task 2: migrate handlers + remove Trigger — reescrever
      `process-channel-event`/`organization-onboarding` como handlers
      pg-boss (zod parse na entrada), enqueue helpers reais (tx-aware),
      `ingestChannelWebhook` ganha `deps.enqueue`, callers ajustados;
      remover `@trigger.dev/*` deps, scripts `trigger:*`/`infra:trigger:*`/
      `jobs:dev`, `docker/trigger/`, `TRIGGER_*` (config + test + env
      example); ADR 0016.

### Checkpoint: Foundation

- [x] `pnpm typecheck && pnpm lint` verdes; `pnpm db:migrate` limpo;
      `pnpm dev` boota com boss up; zero imports `@trigger.dev`.

### Phase 2: Domain features

- [x] Task 3: `closed` materializado — migration (check + partial index),
      guards/filters no core messaging, sweep handler + schedule, badge na
      UI, int tests (resolved→closed; follow-up em chat com closed;
      reopen rejeitado).
- [x] Task 4: auto-reply off-hours — helpers puros `isOffHours`/
      `nextOpening`/`renderOffHoursMessage` + unit tests; send path de
      sistema; dedup por marcador; wiring no handler
      `process-channel-event`; int test com fake channel provider
      (dispara 1×, dedupa no dia, não dispara em horário/sem mensagem).

### Checkpoint: Domain

- [x] Unit + int tests alvo verdes; `pnpm test` geral sem regressão.

### Phase 3: Close-out

- [x] Task 5: docs — `docs/development/jobs-trigger-dev.md` → reescrito
      para pg-boss (renomear), `AGENTS.md` (comandos + how-to "New job"),
      `docs/product/rules.md`/`domain-model.md` (marca entregue),
      `TODO.md` (P1 multi-atendimento fechado; decisão pg-boss movida a
      Concluído), gate final.

## Risks and Mitigations

| Risk                                      | Impact                                                     | Mitigation                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Adapter `{ db }` pg-boss ≠ drizzle tx     | Enqueue não-transacional                                   | Interface mínima `executeSql`; int test prova atomicidade (row visível in-tx, ausente após rollback); fallback documentado pós-commit |
| pg-boss DDL drifts em upgrades            | Schema version mismatch no boot (`migrate:false` verifica) | ADR registra: upgrade de pg-boss exige regerar `getMigrationPlans` em nova migration                                                  |
| `closed` vaza para views/ações            | Closed tratado como ativo                                  | Grep de todos os literais `'resolved'` no core+web; int tests cobrem queue/mine/follow-up                                             |
| Auto-reply duplica sob retry              | Cliente recebe 2×                                          | Job re-lê marcador dentro da mesma tx de insert; retry seguro pois marker já gravado deduplica                                        |
| Boss falha no boot do serverless/edge     | Crash ou jobs mudos                                        | `register()` só roda em `NEXT_RUNTIME=nodejs`; erro de boot → log + captureException, não derruba o web                               |
| Deploy order: app nova antes da migration | `boss.start()` com `migrate:false` falha sem schema        | Entrypoint já roda `migrate.mjs` antes do server — mesma garantia de sempre                                                           |

## Open Questions

- Formato exato de `{proximo_atendimento}` — provisório: "hoje às HH:mm" /
  "amanhã às HH:mm" / "dia DD/MM às HH:mm" ("em breve" sem janelas).
- Cadência do sweep: `*/15 * * * *` (granularidade de 15min para janelas
  de horas — folga suficiente).
- pg-boss versão: pinar a estável atual ≥7 dias de publicação no /build.
