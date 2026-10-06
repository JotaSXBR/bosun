# TODO — Multi-atendimento slice 5 (pg-boss + auto-reply + closed)

> Plano em `tasks/plan.md`. Ordem bottom-up; checkpoint após cada fase.

## Phase 1 — Jobs layer

- [x] **T1 pg-boss foundation**
  - [x] dep `pg-boss` em `@crm/automation` (versão estável ≥7d)
  - [x] `boss.ts`: `startJobs()` singleton + adapter `executeSql` sobre tx drizzle
  - [x] migration custom: `PGBoss.getConstructionPlans("pgboss")` + GRANTs p/ `crm_app`
  - [x] `register()` (instrumentation.ts): boot nodejs-only, `createQueue` ×3, `work`/`schedule` registrados
  - [x] erro de boot → log + captureException, sem derrubar o web
- [x] **T2 handlers + remove Trigger**
  - [x] `process-channel-event` + `organization-onboarding` → handlers pg-boss (zod no payload)
  - [x] `enqueue*` helpers → `boss.send` (tx-aware via `{ db }` adapter)
  - [x] `ingestChannelWebhook(db, token, body, deps)` recebe `deps.enqueue` (dentro da tx)
  - [x] callers: webhook route + `actions/organization.ts` ajustados
  - [x] remove `@trigger.dev/*` deps + scripts + `docker/trigger/` + `TRIGGER_*` (config/test/env.example)
  - [x] ADR 0016: pg-boss in-process (substitui decisão Trigger.dev do ADR 0010)

## Checkpoint fundação

- [x] `typecheck`+`lint` verdes · `db:migrate` limpo · `pnpm dev` sobe com boss · 0 imports `@trigger.dev`

## Phase 2 — Features

- [x] **T3 `closed` materializado**
  - [x] migration: `'closed'` no `conversations_status_check` + partial unique index `not in ('resolved','closed')`
  - [x] `loadActiveTicket` rejeita closed; `resumeTicket` aceita fonte closed; views `mine`/`resolved` tratam closed
  - [x] sweep `close-resolved-tickets`: `withServiceAccess` → per-org `withTenant` update + `emitDomainEvent`
  - [x] badge/label "Encerrada" onde status renderiza no inbox
  - [x] int tests: resolve→sweep→closed; follow-up em chat com closed; reopen rejeitado; queue/mine sem closed
- [x] **T4 auto-reply fora de horário**
  - [x] helpers puros `isOffHours`/`nextOpening`/`renderOffHoursMessage` (+ unit tests, timezone-aware)
  - [x] send path de sistema (`authorId null`, `metadata.system:"off_hours_reply"`, sem patchTicket)
  - [x] dedup 1×/conversa/dia org-local via marcador
  - [x] wiring no handler `process-channel-event` (eventType `message.received`)
  - [x] int test: dispara fora de horário / dedupa / silencioso em horário ou sem `offHoursMessage`

## Checkpoint domínio

- [x] unit + int alvo verdes · `pnpm test` sem regressão

## Phase 3 — Close-out

- [x] **T5 docs**
  - [x] `docs/development/jobs-trigger-dev.md` → pg-boss
  - [x] `AGENTS.md` (comandos, how-to "New job", refs Trigger)
  - [x] `docs/product/rules.md` + `domain-model.md` (pendências entregues)
  - [x] `TODO.md`: P1 multi-atendimento ✅ fechado; decisão pg-boss → Concluído
- [x] Gate: `format:check && typecheck && lint` + `test` + int alvo + `next build`
