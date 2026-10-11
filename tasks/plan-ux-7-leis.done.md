# Plan — UX: 7 leis em todas as telas

- **Origem**: `TODO.md` → "P1 — UX: 7 leis em todas as telas" ·
  `docs/product/ux-7-leis.md` (auditoria + decisões)
- **Lifecycle**: /spec ✅ → /plan → /build → /test → /review → /ship
- **Data**: 2026-10-11

## Objetivo

Toda tela de `apps/web` passa no checklist das 7 leis de UX: 1 CTA
primário visível e ≥44px, ≤3 opções por decisão, progresso em fluxos,
padrões consagrados e ≤7 blocos interativos por tela.

## Contexto

Revisão pós-pesquisa (2026-10-11, fontes em `ux-7-leis.md` § "Nuances
da pesquisa"): checklist da home precisa ficar **sempre visível** enquanto
incompleto e nascer com progresso endowed (1/5 — "org criada" já conta);
o `Steps` mostra "o que falta" na reta final com contagem; isolamento do
primário exige secundários uniformes e danger recolhido; Hick/Miller são
sobre decisão/chunks — agrupar é a alavanca, não remover elementos.

Decisões do gate de esclarecimento (spec, 2026-10-11):

1. **Fitts** — bump do token `control-md` 42→44px (não "primário sempre
   lg"). `h-control-md` resolve via `var(--control-md)` em
   `globals.css @theme` — o bump propaga sem editar utility.
2. **Checklist home** — persistido em `onboarding_checklist` por org
   (não derivado). Tenant-owned: `organization_id` + `pgPolicy`
   `tenantPredicate` + `.enableRLS()` + grant `crm_app`.
3. **Abas IA** — subpaths `/app/settings/ai/<seção>` (mesmo padrão de
   `/settings/teams`), não tabs client-side.
4. **Ticket** — primário por status: open → "Assumir",
   in_progress → "Resolver", waiting_customer → "Retomar"; Adiar +
   Transferir dentro de menu "Mais ações".

Fatores da auditoria (spec): `/app` sem CTA; `settings/ai` com 6 seções
empilhadas (pior ofensor de Miller); integrations com N primários (1 por
linha) e 5 botões na linha WAHA; kanban toolbar sem hierarquia; 2
`<select>` nativos fora do DS; steps de ativação inexistentes.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

- `design-system/src/styles/tokens/spacing.css`
- `design-system/src/components/**`
- `design-system/src/showcase/**`
- `packages/db/src/schema/**`
- `packages/db/migrations/**`
- `packages/core/src/modules/onboarding/**`
- `packages/core/src/modules/messaging/service.ts`
- `packages/core/package.json`
- `apps/web/src/app/app/page.tsx`
- `apps/web/src/app/app/settings/**`
- `apps/web/src/app/app/integrations/**`
- `apps/web/src/app/app/setup/**`
- `apps/web/src/components/ticket-actions.tsx`
- `apps/web/src/components/kanban-toolbar.tsx`
- `apps/web/src/server/**`
- `apps/web/messages/pt-BR.json`
- `apps/web/e2e/**`
- `tasks/**`

## Fora de escopo

- `/design-system` showcase como "tela de produto" (só recebe a seção
  nova do `Steps`), `/widget-demo`, `widget.js`.
- Landing pública/pricing (não existe ainda — regra dos 3 planos fica
  registrada no spec).
- Onboarding virar wizard multi-etapas — o checklist da home cobre a
  ativação.
- Realtime do kanban, toggle de tema, ícones lucide→`<Icon>` (pendências
  já registradas no TODO).
- Refactors adjacentes (forms não-DS além dos 2 selects, "Voltar" em
  telas fora de settings).

## Tarefas

### Fase 1 — Fundação DS

- [x] **T1** Bump `control-md` 42→44: `DESIGN.md` (`spacing.control-md` +
      heights de componentes que citam 42px — button, input, select,
      module-nav-item + linha "42px controls" da prosa) +
      `tokens/spacing.css` `--control-md`. Sem mudança em globals.css
      (var chain).
- [x] **T2** Componente `Steps` (`design-system/src/components/steps.tsx`):
      lista de passos com estado done/current/pending + contador
      "Passo X de Y" + `ProgressBar`; na reta final (falta 1 ou ≥70%)
      o framing vira "o que falta" com contagem ("Quase lá — falta 1");
      estado de conclusão próprio ("Espaço pronto."). Suporta progresso
      parcial inicial (endowed). Showcase em `showcase/` + `COMPONENTS.md`.
- [x] **T3** Trocar `<select>` nativo por `Select` do DS em
      `setup/setup-form.tsx` e `integrations/new-connection-form.tsx`.

**Checkpoint 1** — `pnpm --filter @crm/design-system test` (drift) +
typecheck + lint verdes.

### Fase 2 — Checklist de ativação (backend)

- [x] **T4** `schema/onboarding.ts`: `onboarding_checklist`
      (`organization_id` → cascade, `step` text, `completed_at`, PK
      (org,step), policy tenant, `.enableRLS()`) + export no
      `schema/index.ts` → `db:generate` → revisar → `db:migrate` (grant
      `crm_app` no SQL customizado).
- [x] **T5** `@crm/core/onboarding` (index/service/repository/schemas):
      `ONBOARDING_STEPS` const (org_created → connect_channel →
      create_team → create_funnel → first_conversation),
      `getChecklist(ctx)` e `completeStep(ctx, step)` idempotente;
      subpath `./onboarding` no `packages/core/package.json`.
- [x] **T6** Marcar passos nas actions: `organization.ts` → org_created;
      `integrations.ts` (create) → connect_channel; teams create →
      create_team; leads funnel create → create_funnel; sendOutbound/
      nova conversa → first_conversation.
- [x] **T7** `onboarding.int.test.ts`: RLS cross-org + idempotência do
      completeStep + ordem do checklist.

**Checkpoint 2** — `pnpm test:integration` verde + migrate limpo.

### Fase 3 — Telas

- [x] **T8** `/app` home: card "Primeiros passos" com `Steps` (server
      component lendo `getChecklist`) + CTA primário = link do próximo
      passo; card sempre visível enquanto incompleto (endowed: nasce
      1/5 — "org criada" já marcada); conclusão mostra estado breve
      ("Espaço pronto.") antes de sair da página. Keys i18n
      `dashboard.checklist`.
- [x] **T9** `/app/settings/ai` → subpaths: `ai/layout.tsx` com nav de
      abas (Tabs underline do DS) + `ai/{suggestions,credentials,
observer,agents,knowledge,brain}/page.tsx`; `ai/page.tsx`
      redirecta pra `suggestions`. Link "IA" em `/settings` aponta pro
      hub; "Voltar" vira padrão ghost icon.
- [x] **T10** `ticket-actions.tsx`: primário contextual por status +
      "Mais ações" `DropdownMenu` do DS (Adiar, Transferir — Radix
      `Label`/`Group` se precisar separar ações); secundários todos no
      mesmo estilo (uniformidade é o que sustenta o isolamento do
      primário).
- [x] **T11** Integrations + deals + settings nav: `connection-actions`
      perde `variant="primary"` (secondary) e ciclo de vida + "Excluir"
      vão pra "Mais ações" (danger recolhido = sem isolamento não
      intencional); único primário da página = "Criar conexão" do form.
      `kanban-toolbar`: Select + "Nova etapa" secondary + menu
      (Novo funil / Excluir funil). `/settings` ganha nav de seções.

**Checkpoint 3** — gate completo + smoke manual das 6 perguntas por tela.

### Fase 4 — Gate

- [x] **T12** `docs/development/ux-7-leis-checklist.md` (as 6 perguntas +
      tabela lei→regra) + referência no `workflow.md` seção /review;
      `TODO.md` → Concluído; arquivar plan/todo como `.done.md`.

## Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                                                                                                 |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Bump 42→44 quebra layout denso (toolbars, inputs pill) | Med    | Token é altura mínima, não largura; revisar visualmente showcase + inbox no smoke do Checkpoint 3                                          |
| `onboarding_checklist` sem owner claro de "unmark"     | Baixo  | Passos são one-way (completed_at); spec já diz que itens marcam por ação — sem unmark                                                      |
| Subpaths de settings/ai quebram e2e/deep links         | Med    | `ai/page.tsx` redirect + e2e glob já no Escopo p/ ajustar specs                                                                            |
| Marcar `first_conversation` exige tocar fluxo de send  | Med    | Marcar na action de sendOutbound/new-conversation (camada server, não no ingest) — falha silenciosa é aceitável (passo extra não bloqueia) |

## Critérios de pronto

- [x] `pnpm typecheck` + `pnpm lint` verdes; `pnpm test` sem regressão
- [x] `pnpm test:integration` verde (RLS da `onboarding_checklist`)
- [x] Cada tela de `apps/web` passa nas 6 perguntas do brief (registrado
      por tela na entrega)
- [x] Docs: `ux-7-leis.md` ✅, `COMPONENTS.md` (Steps),
      `docs/development/ux-7-leis-checklist.md`, `TODO.md` → Concluído
