# Implementation Plan: Multi-atendimento (slice 1) — schema + ciclo de conversa

## Overview

Fundação do multi-atendimento conforme `.task-brief.md`: três tabelas
tenant-owned novas (`teams`, `team_members`, `organization_settings`),
extensão de `conversations` (`sector_id`, `assignee_id`, ciclo
`open|in_progress|waiting_customer|resolved`) e `messages.private`, papel
`viewer`, módulo `@crm/core` teams + service de settings, transições
automáticas no inbound, seed atualizado. Sem UI, sem server actions, sem
auto-reply off-hours (slices 2 e 3).

## Architecture Decisions

- **`team_members` carrega `organization_id` denormalizado** — todas as
  tabelas tenant-owned seguem o checklist (org column + `tenantPredicate` +
  `.enableRLS()`); uma policy por subquery em `teams` seria a única exceção
  do repo. Duas FKs: `team_id` (cascade) + `organization_id` (cascade).
- **Transição de status no inbound roda DEPOIS do `insertMessage`**, não no
  `onConflictDoUpdate` do `upsertConversation`: o guard `if (message)` que já
  protege `emitDomainEvent` passa a proteger também a transição — replay de
  webhook não re-abre conversa resolvida nem altera assignee.
- **Check constraint de status via SQL editado à mão na migração nova**:
  drizzle-kit historicamente não difa `check()` — o passo "review SQL" do
  workflow cobre isso (migrações só são imutáveis depois de aplicadas).
  Ordem: `UPDATE conversations SET status='resolved' WHERE status='archived'`
  → drop do check antigo → create do check novo.
- **`viewer` read-only**: `messaging:read`, `integrations:read`,
  `audit:read`, `teams:read` — sem billing, sem escrita (provisório, ver
  brief). Novo resource `teams: ["read","manage"]`: manage para
  owner/admin/manager, read para todos os membros.
- **`organization_settings` 1:1** (`organization_id` unique), get-or-create
  no service. `business_hours` jsonb com shape zod provisório
  `{ timezone, windows: { mon..sun: [{start,end}] } }` — definido agora para
  os dados já nascerem válidos para o auto-reply futuro.
- **Notas internas** = `messages` com `private=true` (`direction='outbound'`,
  nunca enviadas ao provider) — a coluna entra agora; a action de criar nota
  é slice 2.
- **`conversation.updated`** é emitido quando o inbound muda o status —
  `domainEventSchema` é loose (type é string livre), sem mudança em
  `packages/db/src/realtime.ts`.

## Task List

Detalhamento em `tasks/todo.md`.

### Phase 1 — Foundation
- Task 1: Schema + migração (teams, team_members, organization_settings,
  conversations/messages)
- Task 2: Papel `viewer` + resource `teams` em `@crm/permissions`

### Checkpoint: Foundation
- `pnpm typecheck && pnpm lint && pnpm test` verdes; migração aplicada local

### Phase 2 — Domain
- Task 3: Módulo `@crm/core` teams (CRUD + membros) + int tests
- Task 4: `organization_settings` get-or-create/update + int tests
- Task 5: Lifecycle no `ingestChannelEvent` + `messages.private` + int tests

### Checkpoint: Domain
- `pnpm test:integration` verde (transições + isolamento cross-org)

### Phase 3 — Wrap-up
- Task 6: Seed (viewer@crm.local + times demo)
- Task 7: Docs (domain-model → implemented; TODO.md)

### Checkpoint: Complete
- `pnpm typecheck && pnpm lint && pnpm test` + int verdes; brief criteria
  cumpridos

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| drizzle-kit não gera diff do check de status | Med | Revisar SQL gerado; editar a migração NOVA à mão (data migration + drop/add check) antes de `db:migrate` |
| Replay de webhook re-abre conversa resolvida manualmente depois | Med | Transição só roda quando `insertMessage` retorna row (dedup por external_id) |
| `viewer` quebrar better-auth org plugin | Low | `roles` é consumido via objeto; member.role é text sem check no DB |
| Ordem escopo→FORCE RLS na migração | Low | Seguir padrão 0004: policies no generate, `ALTER ... FORCE RLS` no fim |
| STATUS_LABELS em `inbox/page.tsx` menciona `archived` | Low | Chave morta e inócua; UI é slice 3 (fora de escopo agora) |

## Open Questions

- Nenhuma bloqueante. Provisórias registradas no `## Contexto` do brief
  (reopen mantém setor/zera assignee; escopo de leitura do viewer; shape de
  `business_hours`).
