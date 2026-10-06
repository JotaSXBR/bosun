# TODO — Multi-atendimento slice 4 (settings + teams UI)

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Task 1: `ticketReopenWindowHours` em `@crm/core/organizations`

**Description:** `updateOrgSettingsInput` (schemas.ts) ganha
`ticketReopenWindowHours: z.number().int().min(1).max(168).optional()`;
`upsertSettings` (repository.ts) aceita `ticketReopenWindowHours?: number`
— `undefined` preserva o valor (drizzle ignora undefined em values/set).

**Acceptance criteria:**

- [x] Schema rejeita 0, 169, 1.5 e aceita 1/48/168 (unit test novo)
- [x] Int test: `updateOrganizationSettings` persiste a janela e
      `getOrganizationSettings` relê; update sem o campo preserva o anterior

**Verification:** `pnpm --filter @crm/core test` + `test:integration`
(infra up) + typecheck. **Files:**
`packages/core/src/modules/organizations/{schemas,repository}.ts`,
`service.int.test.ts`, `schemas.test.ts` (novo). **Scope:** S · **Deps:**
none

## Task 2: `TEAM_NAME_TAKEN` no service de teams

**Description:** `createTeam`/`updateTeam` capturam unique violation
(pg `23505`, `constraint_name === "teams_org_name_idx"` — verificar
`err.code` e `err.cause?.code`, drizzle embrulha) e relançam
`DomainError("TEAM_NAME_TAKEN", "Já existe uma equipe com esse nome.")`.

**Acceptance criteria:**

- [x] Duplicado vira DomainError (não erro cru de pg)
- [x] Int test: criar/update com nome existente → `TEAM_NAME_TAKEN`

**Verification:** `pnpm --filter @crm/core test:integration` + typecheck.
**Files:** `packages/core/src/modules/teams/service.ts`,
`service.int.test.ts`. **Scope:** S · **Deps:** none

### Checkpoint: Foundation

- [x] `typecheck` + `lint` verdes; testes de core passando

## Task 3: Wiring web — wrapper + Server Actions

**Description:** `services.ts` ganha `getOrgSettings(ctx)` →
`getOrganizationSettings`. Novo `server/actions/settings.ts` com
`updateOrgSettingsAction` (safeParse → `updateOrganizationSettings` →
`revalidatePath("/app/settings")`). Novo `server/actions/teams.ts` com
`createTeamAction`, `updateTeamAction`, `deleteTeamAction`,
`addTeamMemberAction`, `removeTeamMemberAction` →
`revalidatePath("/app/settings/teams")`. Ambos no padrão `messaging.ts`:
`requireTenantContext`, `{ ok: true } | { ok: false, error }`,
`errorMessage` PT-BR com `DomainError.message` + `captureException`.

**Acceptance criteria:**

- [x] Actions retornam o contrato `{ ok }`; orgId vem só de
      `requireTenantContext` (nunca do input)
- [x] `TEAM_NAME_TAKEN` e erros zod chegam ao client em PT-BR

**Verification:** typecheck + lint. **Files:** `server/services.ts`,
`server/actions/settings.ts`, `server/actions/teams.ts`. **Scope:** M ·
**Deps:** T1, T2

## Task 4: `/app/settings` — formulário da organização

**Description:** `app/app/settings/page.tsx` (server): `getOrgSettings` +
`canEdit = hasPermission(ctx.role, { organization: ["update"] })`; link
"Gerenciar equipes" → `/app/settings/teams` + "Voltar" → `/app`.
`settings-form.tsx` (client, receita `new-connection-form.tsx`): campos
janela de reabertura (number 1–168, `z.coerce.number().int().min(1).max(168)`),
`offHoursMessage` (textarea, `{proximo_atendimento}` no placeholder),
`timezone`, `locale`; submit → `updateOrgSettingsAction` + toast PT-BR.
`!canEdit` → campos `disabled` e sem botão salvar.

**Acceptance criteria:**

- [x] Owner/admin salva e recarrega com valores persistidos
- [x] manager/agent/viewer veem valores read-only
- [x] Validação client-side rejeita janela fora de 1–168 antes do submit

**Verification:** `next build` + lint + smoke manual. **Scope:** M ·
**Deps:** T3

## Task 5: `/app/settings/teams` — CRUD de equipes + membros

**Description:** `app/app/settings/teams/page.tsx` (server):
`listSectors(ctx)` + `listMembers(ctx)` +
`canManage = hasPermission(ctx.role, { teams: ["manage"] })`.
`teams-manager.tsx` (client island): formulário inline "Nova equipe"
(nome + cor); por equipe — swatch de cor, nome, lista de membros com nomes,
select de não-membros + Adicionar, remover membro (×), editar nome/cor,
excluir com `window.confirm`. Tudo via actions da T3 + toast.

**Acceptance criteria:**

- [x] Criar/editar/excluir equipe reflete na lista (revalidatePath)
- [x] Adicionar/remover membro atualiza `memberUserIds`
- [x] agent/viewer veem equipes read-only (sem island de escrita)
- [x] Nome duplicado → toast "Já existe uma equipe com esse nome."

**Verification:** `next build` + lint + smoke manual. **Scope:** M/L ·
**Deps:** T3

## Task 6: Nav + e2e smoke + docs

**Description:** Link "Configurações" no header de `/app/page.tsx`.
`e2e/settings.spec.ts` smoke (padrão `inbox.spec.ts`): sign-up → onboarding
→ `/app/settings` renderiza form + `/app/settings/teams` cria equipe e
aparece na lista. `TODO.md`: slice 4 entregue → Concluído; `domain-model.md`:
nota "UI de teams/settings entregue" se convencionar algo.

**Acceptance criteria:**

- [x] `/app` linka para `/app/settings`
- [x] e2e smoke verde (ou justificativa se ambiente não permitir)
- [x] `TODO.md` e docs atualizados

**Verification:** gate completo (`format:check && typecheck && lint &&
test` + int dos pacotes tocados + `next build`). **Scope:** S ·
**Deps:** T4, T5
