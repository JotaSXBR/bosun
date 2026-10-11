# TODO — UX: 7 leis em todas as telas

Plano: `tasks/plan.md` · Spec: `docs/product/ux-7-leis.md`

## Fase 1 — Fundação DS

- [x] **T1** Bump `control-md` 42→44px
  - Acceptance: `DESIGN.md` e `tokens/spacing.css` declararem 44px;
    `tokens.test.ts` verde; heights de componentes no front matter
    atualizadas (button/input/select/module-nav-item 42→44)
  - Verify: `pnpm --filter @crm/design-system test`
  - Files: `DESIGN.md`, `design-system/src/styles/tokens/spacing.css`

- [x] **T2** Componente `Steps`
  - Acceptance: `components/steps.tsx` renderiza lista done/current/
    pending, contador "Passo X de Y", `ProgressBar`; reta final
    (falta 1 ou ≥70%) mostra "o que falta" + copy motivacional;
    estado de conclusão; suporta start >0 (endowed); showcase +
    `COMPONENTS.md`
  - Verify: typecheck do pacote + showcase renderiza
  - Files: `design-system/src/components/steps.tsx`,
    `design-system/src/showcase/*`, `design-system/COMPONENTS.md`

- [x] **T3** Selects nativos → `Select` do DS
  - Acceptance: nenhum `<select` cru em `apps/web/src` fora de componentes
    DS; comportamento idêntico (mesmas opções/valores)
  - Verify: typecheck + lint; smoke do form de setup e nova conexão
  - Files: `apps/web/src/app/app/setup/setup-form.tsx`,
    `apps/web/src/app/app/integrations/new-connection-form.tsx`

## Checkpoint 1 — drift test + typecheck + lint verdes

## Fase 2 — Checklist de ativação (backend)

- [x] **T4** Tabela `onboarding_checklist`
  - Acceptance: migration aplicada com PK (org,step), FK org cascade,
    policy tenant `app.organization_id`, `.enableRLS()`, grant `crm_app`
  - Verify: `pnpm db:generate` SQL revisado + `pnpm db:migrate`
  - Files: `packages/db/src/schema/onboarding.ts`, `schema/index.ts`,
    `packages/db/migrations/*`

- [x] **T5** Módulo `@crm/core/onboarding`
  - Acceptance: `ONBOARDING_STEPS` (5 passos na ordem do spec),
    `getChecklist(ctx)` retorna passos + estado, `completeStep(ctx,step)`
    idempotente; exports no index + subpath no package.json
  - Verify: `pnpm --filter @crm/core typecheck` + test unit do service
  - Files: `packages/core/src/modules/onboarding/*`,
    `packages/core/package.json`

- [x] **T6** Marcar passos nas server actions
  - Acceptance: criar org → org_created; criar conexão → connect_channel;
    criar equipe → create_team; criar funil → create_funnel; primeiro
    send/nova conversa → first_conversation. Falha no mark não quebra a
    action (best-effort)
  - Verify: typecheck + smoke: criar conexão marca passo
  - Files: `apps/web/src/server/actions/*`, `apps/web/src/server/services.ts`

- [x] **T7** `onboarding.int.test.ts`
  - Acceptance: prova isolamento cross-org (RLS), idempotência, ordem
  - Verify: `pnpm test:integration`
  - Files: `packages/core/src/modules/onboarding/onboarding.int.test.ts`

## Checkpoint 2 — `pnpm test:integration` + migrate limpos

## Fase 3 — Telas

- [x] **T8** Home `/app` com "Primeiros passos"
  - Acceptance: card com `Steps` + CTA primário = próximo passo pendente;
    sempre visível enquanto incompleto; endowed — nasce 1/5 (org criada);
    conclusão mostra estado breve antes de sumir; i18n `dashboard.checklist`
  - Verify: typecheck + smoke dev (org nova vê 1/5)
  - Files: `apps/web/src/app/app/page.tsx`, `apps/web/messages/pt-BR.json`

- [x] **T9** `/app/settings/ai` em subpaths
  - Acceptance: 6 subrotas com nav de abas; `/settings/ai` redirecta para
    `suggestions`; cada seção idêntica ao que era; "Voltar" padrão ghost
  - Verify: typecheck + e2e/smoke das rotas
  - Files: `apps/web/src/app/app/settings/ai/**`

- [x] **T10** Primário contextual em `ticket-actions.tsx`
  - Acceptance: 1 `variant="primary"` por estado (open→Assumir,
    in_progress→Resolver, waiting→Retomar); Adiar + Transferir em
    DropdownMenu "Mais ações"; ≤3 controles visíveis
  - Verify: typecheck + smoke da thread
  - Files: `apps/web/src/components/ticket-actions.tsx`

- [x] **T11** Hierarquia: integrations + deals + settings nav
  - Acceptance: `/integrations` com 1 primário (form); linhas sem
    `variant="primary"`; ciclo de vida + Excluir em menu (sem danger
    solto ao lado de secundários). Toolbar do kanban: Select + ≤1
    secondary + menu. `/settings` com nav de seções
  - Verify: typecheck + smoke; grep sem `variant="primary"` nas linhas
  - Files: `apps/web/src/app/app/integrations/connection-actions.tsx`,
    `apps/web/src/components/kanban-toolbar.tsx`,
    `apps/web/src/app/app/settings/page.tsx`

## Checkpoint 3 — gate completo + checklist das 6 perguntas por tela

## Fase 4 — Gate

- [x] **T12** Checklist das 7 leis vira gate de review
  - Acceptance: `docs/development/ux-7-leis-checklist.md` criado e
    referenciado em `docs/development/workflow.md` (/review); `TODO.md`
    movido para Concluído; `plan.md`/`todo.md` arquivados `.done`
  - Verify: arquivos existem; links resolvem
  - Files: `docs/development/ux-7-leis-checklist.md`,
    `docs/development/workflow.md`, `TODO.md`, `tasks/*`
