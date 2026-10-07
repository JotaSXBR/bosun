# Tasks — Leads/funil

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Fase 1 — Domínio

- [x] T1 schema `leads.ts` (6 tabelas + RLS + índices) → generate+migrate
      (`0015_loving_marvel_boy`)
- [x] T2 permissions: resource `leads` (read/write/manage) + roles + test
- [x] T3 `@crm/core/leads`: schemas+repo+service (funnel/stage/deal/label,
      moveDeal, createDealFromConversation, getBoard) + subpath export
- [x] T4 FUNNEL_TEMPLATES (4 nichos) + seed funil demo + labels demo
- [x] T5 int tests: RLS ×6, link conversa→deal (unique), move, labels,
      templates — 15/15 em 2 arquivos

## Checkpoint 1

- [x] typecheck + lint + test:integration verdes; migrate limpo

## Fase 2 — Server layer

- [ ] T6 `actions/leads.ts` + wrappers `services.ts`

## Fase 3 — UI

- [ ] T7 `/app/deals` kanban (funil select, colunas, cards, dnd, dialogs)
- [ ] T8 conversa: aside com deal vinculado / "Virar lead" + labels
- [ ] T9 labels: chips kanban + editor na conversa

## Checkpoint 2

- [ ] format + typecheck + lint verdes; smoke manual do fluxo

## Fase 4 — E2E + docs

- [ ] T10 `deals.spec.ts` e2e real local
- [ ] T11 TODO.md → Concluído; domain-model/roadmap status
