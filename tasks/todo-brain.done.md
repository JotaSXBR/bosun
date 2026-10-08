# Tasks — Second brain (memória do copiloto)

## Task 1: Schema

**Description:** `packages/db/src/schema/brain.ts` com `memory_entries`
(org_id + type + scope org|team|contact + team_id/contact_id + content +
confidence + sources jsonb + status canon|stale|archived|superseded +
superseded_by + stale_after + verified_by/at + search tsvector + RLS).
`agents` += `brain_access` + `brain_types`; `agent_suggestions` +=
`proposed_by`. Migration + grants `crm_app`.

**Acceptance criteria:**

- [x] Migration aplicada; int test prova isolamento cross-org + insert
- [x] `pnpm typecheck` verde

## Task 2: `@crm/core/brain`

**Description:** módulo `modules/brain` — listCanon (scope/type/FTS),
listStale, proposeEntry (staging humano via suggestions, `ai:manage`,
grava `proposed_by`), renewEntry/archiveEntry (`ai:manage`),
`searchBrain` sem ctx pro observer (canon + staging marcado + pendentes
p/ dedupe).

**Acceptance criteria:**

- [x] Int test: CRUD + stale/renew + isolamento + permissão negada
- [x] `searchBrain` retorna canon+staging sem ctx de usuário

## Task 3: suggestions target_type "memory"

**Description:** enum += `"memory"`; `memoryProposalSchema` valida
payload; approve: supersede marca antiga + insere canon (verified_by/at)
na mesma tx; four-eyes — `proposed_by ≠ reviewer` exceto `owner`;
`createSystemSuggestion` p/ observer (proposed_by null).

**Acceptance criteria:**

- [x] Int test: promote cria canon; supersede marca antiga; não-owner
      self-approve falha; owner self-approve passa

## Task 4: `@crm/ai` observer += memórias

**Description:** `ObserverInput` += brainCanon/brainStaging(marcado)/
pendingMemoryTexts; output zod += `memories[]` (type/scope/content/
confidence/staleAfterDays/supersedes?); prompt com regra sem-PII,
confidence ≥ medium, não repropor canon.

**Acceptance criteria:**

- [x] Unit test `ai.test.ts`: mock model → memórias estruturadas;
      confidence low filtrada no consumer

## Task 5: automation — observer memórias + stale sweep

**Description:** observer job monta brain context (`searchBrain`) e
grava `memories[]` como suggestions via `createSystemSuggestions`; task
`brain-stale-sweep` diária canon→stale; registro `boss.ts` + enqueue.

**Acceptance criteria:**

- [x] Int test: fake analyze → suggestions memory pendentes; sweep marca
      stale expirado; sem boss → skipped

## Task 6: UI `/app/settings/ai` — seção Brain

**Description:** `brain-section.tsx` — canon list (type/scope/stale),
stale queue (renovar/arquivar), dialog propor entrada; inbox mostra
badge memory + payload legível; actions + services + catálogo
`settings.ai.brain`/`memory`.

**Acceptance criteria:**

- [x] Zero literal PT em JSX novo; seções renderizam com seed
- [x] Ações wired: propor → pending; renovar limpa stale

## Task 7: e2e + docs + gate

**Description:** spec (propor → owner aprova → canon; stale → renovar).
`docs/domains/README.md`, `TODO.md` entregue, tasks arquivadas.

**Acceptance criteria:**

- [x] Gate completo verde + CI
