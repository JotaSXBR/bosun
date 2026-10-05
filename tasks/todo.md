# Tasks — Multi-atendimento (slice 1)

Brief: `.task-brief.md` · Plan: `tasks/plan.md`

## Task 1: Schema + migração ✅

**Description:** Criar `schema/teams.ts` (`teams`: org, name, color;
`team_members`: org, team_id→cascade, user_id→users cascade,
unique(team_id,user_id)) e `schema/settings.ts` (`organization_settings`:
org unique, `business_hours` jsonb default '{}', `off_hours_message` text,
`timezone` text default 'America/Sao_Paulo'). Estender `conversations`
(`sector_id`→teams nullable, `assignee_id`→users nullable, check
`open|in_progress|waiting_customer|resolved`) e `messages` (`private`
bool notNull default false). Exportar no `schema/index.ts`, gerar migração,
revisar/editar SQL (data migration archived→resolved, drop/add check,
FORCE RLS nas 3 tabelas novas) e aplicar com infra up.

**Acceptance criteria:**

- [x] `pnpm db:generate` produz migração; SQL revisado contém
      `UPDATE ... archived→resolved`, drop/add do check e FORCE RLS
- [x] `pnpm db:migrate` aplica limpo; `\d conversations` mostra as 2 colunas
      e o check novo
- [x] `pnpm typecheck` verde

**Verification:** `pnpm infra:up && pnpm db:migrate`; `pnpm typecheck`

## Task 2: Papel viewer + resource teams ✅

**Description:** Em `@crm/permissions`: statement ganha
`teams: ["read","manage"]`; `viewer` role com reads
(messaging/integrations/audit/teams); owner/admin/manager ganham
`teams:manage`; agent ganha `teams:read`; `ORG_ROLES` inclui `viewer`.
Teste unitário cobrindo o viewer (read ok, qualquer write/billing nega).

**Acceptance criteria:**

- [x] `hasPermission("viewer", { messaging: ["read"] })` → true;
      `{ billing: ["read"] }` e writes → false
- [x] `isOrgRole("viewer")` → true

**Verification:** `pnpm --filter @crm/permissions test` — 10/10

## Checkpoint: Foundation ✅

- [x] `pnpm typecheck && pnpm lint && pnpm test` verdes
- [x] Migração 0005 aplicada no Postgres local

## Task 3: Módulo teams em @crm/core ✅

**Description:** `packages/core/src/modules/teams/{index,service,repository,
schemas}.ts`: `listTeams` (com member userIds), `createTeam`,
`updateTeam` (name/color), `deleteTeam`, `addTeamMember`,
`removeTeamMember`. Writes exigem `teams:manage`; leitura `teams:read`.
`addTeamMember` valida que o usuário é membro da org. Subpath export
`@crm/core/teams` adicionado ao package.json.

**Acceptance criteria:**

- [x] CRUD + membros funcionando via service com TenantContext
- [x] `AuthorizationError` para agent/viewer em writes
- [x] Int test: isolamento cross-org + member-add de não-membro rejeitado +
      RLS na escrita direta

**Verification:** `pnpm test:integration` — 5/5

## Task 4: organization_settings service ✅

**Description:** No módulo organizations: `getOrganizationSettings`
(get-or-create com defaults; todo membro pode ler) e
`updateOrganizationSettings` (assert `organization:update`; zod valida
`business_hours` `{windows: {mon..sun: [{start,end}]}}` e
`off_hours_message`). Repository com get-or-create + upsert por org.

**Acceptance criteria:**

- [x] get-or-create retorna defaults na 1ª chamada e persiste updates
- [x] Viewer/agent recebem `AuthorizationError` no update
- [x] Int test de isolamento cross-org + shape inválido rejeitado

**Verification:** `pnpm test:integration` — 5/5

## Task 5: Lifecycle inbound + messages.private ✅

**Description:** Em messaging: `insertMessage` aceita `private`; após
insert bem-sucedido de `message.received`, `applyInboundStatusTransition` —
`resolved`→`open` (mantém `sector_id`, zera `assignee_id`);
`waiting_customer`→`in_progress` — e emite `conversation.updated` quando o
status muda.

**Acceptance criteria:**

- [x] Int test: inbound em resolved → open, assignee null, sector intacto
- [x] Int test: inbound em waiting_customer → in_progress
- [x] Int test: replay do mesmo webhook (external_id dup) não re-transiciona
- [x] `messages.private` persiste e retorna em `listMessages`

**Verification:** `pnpm test:integration` — 4/4 novos

## Checkpoint: Domain ✅

- [x] `pnpm test:integration` verde (56/56 — transições + RLS das 3 tabelas)
- [x] `pnpm typecheck && pnpm lint` verdes

## Task 6: Seed ✅

**Description:** `packages/auth/src/seed.ts`: usuário `viewer@crm.local`

- times demo "Vendas"/"Suporte" (agent em ambos, manager em Vendas) —
  `ensureDemoTeams` helper idempotente.

**Acceptance criteria:**

- [x] `pnpm db:seed` idempotente (2× sem erro/duplica)

## Task 7: Docs ✅

**Description:** `docs/product/domain-model.md` marca teams/settings/
lifecycle/viewer como implemented; `TODO.md` registra slice 1 entregue.

**Acceptance criteria:**

- [x] Docs refletem o que existe; pendências de slice 2/3 explícitas

## Checkpoint: Complete ✅

- [x] `pnpm typecheck` (14/14) + `pnpm lint` (14/14, 0 problems) +
      `pnpm test` (80/80) + `pnpm test:integration` (56/56) verdes
- [x] Critérios de pronto do `.task-brief.md` checados

## Nota de sessão

- **Bug corrigido fora do plano** (autorizado pelo usuário):
  `globMatch` em `.devin/hooks/workflow.mjs` tratava `dir/**` como apenas
  filhos diretos — o replace de `*` remontava o `*` dentro do `.*` inserido
  (e `?` comia o `?` de `(.+/)?`). Fix via placeholders `\x01`/`\x02`.
