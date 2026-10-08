# Plan — Second brain (memória do copiloto)

Fonte: `.task-brief.md` (escopo) + decisões travadas nas 4 rodadas de
perguntas. Observer v1 já entregue (`581cdd4`…`9eae716`).

## Desenho (uma linha)

`agent_suggestions` com `target_type:"memory"` = staging; approve
promove a `memory_entries` (canon). Observer lê canon+staging marcado e
propõe memórias junto das sugestões de config. `stale_after` + sweep job
marcam `stale`; humano renova ou arquiva.

## Fatias

### T1 — Schema

- `packages/db/src/schema/brain.ts`: `memory_entries` — org_id, `type`
  (8 tipos), `scope` (org|team|contact) + `team_id`/`contact_id`
  nullable, `content`, `confidence`, `sources` jsonb, `status`
  (canon|stale|archived|superseded), `superseded_by` self-FK,
  `stale_after`, `verified_by`/`verified_at`, timestamps, `search`
  tsvector gerado, RLS `tenantPredicate`.
- `agents` += `brain_access` (off|read, default off) + `brain_types`
  (jsonb array).
- `agent_suggestions` += `proposed_by` (users.id nullable — four-eyes
  precisa saber quem propôs; observer = null/sistema).
- Migration + int test de isolamento cross-org.

### T2 — `@crm/core/brain`

- Módulo `modules/brain` (index/service/repository/schemas):
  - `listCanonEntries(db, ctx, {scope,type,q,contactId,teamId})` — FTS +
    filtros, `ai:read`.
  - `listStaleEntries` — canon com `stale_after < now`, `ai:read`.
  - `proposeEntry(db, ctx, input)` — humano propõe staging via
    suggestions (`ai:manage`); grava `proposed_by = ctx.userId`.
  - `renewEntry` (limpa stale, novo `stale_after`) / `archiveEntry` —
    `ai:manage`.
  - `searchBrain(db, orgId, opts)` — read interno sem ctx pro observer
    (canon + staging marcado + pendentes p/ dedupe).
- Int test: CRUD/stale/renova, RLS.

### T3 — suggestions `target_type:"memory"`

- `target_type` enum += `"memory"`; payload schema = entrada proposta
  (`memoryProposalSchema`: type/scope/ids/content/confidence/
  staleAfter/supersedes).
- `approve`: valida payload → tx: se `supersedes`, marca antiga
  `superseded` + `superseded_by` → insere canon com `verified_by/
verified_at` → suggestion `approved`. Rejeita self-approve: quem
  propôs (`proposed_by`) ≠ reviewer — **exceto role `owner`**.
- `createSystemSuggestion` emite propostas do observer (proposed_by null
  → qualquer ai:manage aprova).
- Int test: promote, supersede, four-eyes, owner self-approve.

### T4 — `@crm/ai` observer += memórias

- `ObserverInput` += `brainCanon[]`, `brainStaging[]` (marcado
  "unverified"), `pendingMemoryTexts[]` (dedupe).
- Output zod += `memories[]`: {type, scope, teamId?, contactId?,
  content, confidence(low|medium|high), staleAfterDays, supersedes?}.
- Prompt: regra sem-PII; só propor confidence ≥ medium (abaixo → nem
  emite); staging marcado; canon = fatos estáveis — não repropor.
- Unit test com mock model (padrão existente em `ai.test.ts`).

### T5 — automation

- `observer-analyze.ts`: monta `ObserverInput` com brain context via
  `searchBrain`; grava `memories[]` filtradas (≥ medium) como
  suggestions `target_type:"memory"` via `createSystemSuggestions`.
- Nova task `brain-stale-sweep` (diária): `canon` + `stale_after < now`
  → `stale`. Registra em `boss.ts` + enqueue.
- Int test: observer com fake analyze → memory suggestions pendentes;
  sweep marca stale.

### T6 — UI `/app/settings/ai` — seção Brain

- `brain-section.tsx`: canon list (badges type/scope/stale), stale queue
  (renovar/arquivar), dialog "propor entrada" (staging humano).
- Suggestions inbox: badge `target_type:"memory"` + payload legível.
- Actions `server/actions/ai.ts` += propose/renew/archive; `services.ts`
  += listCanon/listStale.
- Catálogo `settings.ai.brain`/`memory` em `pt-BR.json`.

### T7 — e2e + docs + gate

- Spec: propor entrada → owner aprova → canon lista; stale flow.
- `docs/domains/README.md` AI row; `TODO.md` entregue; tasks arquivadas.
- Gate completo + CI.
