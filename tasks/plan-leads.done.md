# Implementation Plan — Leads/funil (funnels, stages, deals, labels, kanban)

## Overview

Slice "uma conversa pode virar lead": funis multi-etapa por org com
templates de nicho, deals kanban pertencentes ao contato (+conversa
opcional), labels aplicáveis a deals e conversas, atributos customizados
jsonb. UI funcional em shadcn stock: `/app/deals` (kanban) + painel de
deal/labels na página da conversa (layout Synthor). Spec:
`docs/product/domain-model.md` § Leads/funil. Brief: `.task-brief.md`.

## Architecture Decisions

- **Schema** `packages/db/src/schema/leads.ts` — 6 tabelas tenant-owned
  (padrão `conversations`: `organization_id` + `tenantPredicate` +
  `.enableRLS()` + grant via default privileges):
  - `funnels(id, organization_id, name, template_ref?, created_at)`
  - `funnel_stages(id, organization_id, funnel_id→cascade, name,
position int, color text, created_at)` — unique (funnel, position)
  - `deals(id, organization_id, funnel_id, stage_id, contact_id→cascade,
conversation_id?→set null, title, value_cents bigint default 0,
position int, custom_attributes jsonb default {}, created_at,
updated_at)`
  - `labels(id, organization_id, name, color)` — unique (org, name)
  - `deal_labels(deal_id, label_id, PK composto)` +
    `conversation_labels(conversation_id, label_id, PK composto)` — ambos
    com `organization_id` pra RLS uniforme
  - Índices: deals (org,funnel,stage,position), (org,contact),
    (org,conversation) parcial `where conversation_id is not null`
- **Permissões**: resource `leads: ["read","write","manage"]` —
  `write` (agent+): criar/editar/mover deal, aplicar label; `manage`
  (manager+): funis/stages/labels CRUD e deletar deal; `read`: viewer+.
- **Posição kanban**: `position int` por stage; mover = reatribuir
  sequencial na coluna alvo (small-data, sem lexorank).
- **Templates de nicho**: mapa declarativo `FUNNEL_TEMPLATES` no módulo
  leads (imobiliária, clínica, varejo/ecommerce, serviços — ~4); stage
  CRUD independente após aplicar. `template_ref` registra a origem.
- **createDealFromConversation**: input `conversationId` → resolve
  contato da conversa (service, dentro do tenant) → deal com
  `contact_id`+`conversation_id`. Uma conversa linka no máx. 1 deal:
  unique parcial `deals_conversation_unique` on
  `(organization_id, conversation_id) where conversation_id is not null`.
- **DnD**: `@dnd-kit/core`+`sortable` em `apps/web` (dep nova —
  justificada: kanban). Otimista no client + server action `moveDeal`.
- **Sem realtime v1**: kanban não recebe SSE (SSE atual é por conversa);
  `revalidatePath` cobre ações próprias. Nota no TODO pra fase realtime.
- **Audit**: `deal.created`/`deal.deleted`/`deal.linked` no audit log;
  moves são high-frequency → fora (decisão documentada).
- **Labels UI**: chips + editor type-to-create (cria label org na hora,
  `manage` pra criar? — decisão: criar label exige `manage`, aplicar
  existente exige `write`; UI esconde input de nova label pra quem não
  pode).

## Task List

### Phase 1: Domínio (DB + core)

- [ ] **T1** `schema/leads.ts`: 6 tabelas + índices + policies + export
      no `schema/index.ts` → `pnpm db:generate` → revisar SQL →
      `db:migrate`
- [ ] **T2** `packages/permissions`: resource `leads` + roles (ver
      decisão acima) + ajustar `index.test.ts` se a matrix for assertada
- [ ] **T3** `@crm/core/leads` módulo: schemas zod + repository + service
      (funnel/stage/deal/label CRUD, `moveDeal`, `createDealFromConversation`,
      `applyTemplate`, queries kanban `listBoard`) + `index.ts` exports +
      subpath `./leads` em `packages/core/package.json`
- [ ] **T4** `FUNNEL_TEMPLATES` declarativos + seed do funil demo no
      `packages/auth/src/seed.ts`
- [ ] **T5** int tests `leads.int.test.ts`: RLS cross-org em todas as
      tabelas, create-from-conversation (link + unique), move position,
      label apply/remove, template gera stages

**Checkpoint 1** — `typecheck`+`lint`+`test:integration` verdes; migrate
limpo.

### Phase 2: Server layer

- [ ] **T6** `apps/web/src/server/actions/leads.ts` (funnel/stage/deal/
      label actions, zod nos inputs, `{ok}`/`{ok:false,error}`,
      `revalidatePath`) + wrappers de leitura em `services.ts`
      (`listFunnels`, `getBoard`, `listLabels`, `getDealForConversation`)

### Phase 3: UI

- [ ] **T7** `/app/deals` kanban: seletor de funil (+ criar funil via
      template), colunas de stage, cards (título, contato, valor, label
      chips), drag entre colunas, dialog novo deal (contact combobox),
      editor de stage (rename/cor/add/delete) — `components/kanban*`
- [ ] **T8** conversa: aside direito na página da conversa — card do
      deal vinculado (stage select inline, valor, attrs) ou botão
      "Virar lead" (dialog: funil+stage+título) + seção de labels da
      conversa
- [ ] **T9** labels: chips nos cards do kanban + editor de labels da
      conversa no aside (type-to-create se `manage`)

**Checkpoint 2** — gate completo (format/typecheck/lint) + smoke manual
do fluxo.

### Phase 4: E2E + docs

- [ ] **T10** spec e2e `deals.spec.ts` (criar funil → virar lead da
      conversa → mover no kanban) + `pnpm test:e2e` local real
- [ ] **T11** docs: `TODO.md` → Concluído, `domain-model.md`/roadmap
      status, `docs/domains/` nota se couber

## Risks and Mitigations

| Risk                                      | Impact | Mitigation                                                                                                                         |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| DnD cross-column + RSC complexity         | Med    | Client component isolado; drop = uma action `moveDeal(dealId, stageId, position)`; fallback: select de stage no card se dnd falhar |
| 6 tabelas de uma vez                      | Baixo  | Schema único, checklist RLS por tabela, int test prova isolation de todas                                                          |
| Labels criadas inline viram bagunça       | Baixo  | unique (org,name) case-insensitive? — decidir: normalizar `trim` + unique exata (simples)                                          |
| Kanban sem realtime confunde multi-agente | Baixo  | `revalidatePath` + nota no TODO (fase realtime generaliza SSE)                                                                     |

## Open Questions

- Cor de stage/label: text field com hex ou paleta fixa? (v1: paleta fixa
  de ~10 cores no select — simples, consistente)
