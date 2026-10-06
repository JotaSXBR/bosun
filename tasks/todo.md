# TODO — Multi-atendimento slice 3 (inbox operável)

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Task 1: Nomes + org members nas queries de domínio

**Description:** `listOrgMembers` em organizations
(`organization_members ⋈ users` → `{userId, name, email, role}`, permissão
`messaging:read`); `listConversations` + leftJoin `users`→`assigneeName` +
leftJoin `teams`→`sectorName`; `listMessages` + leftJoin
`users`→`authorName`; `getConversation` + contact join +
`precededTicket` (nº do ticket anterior).

**Acceptance criteria:**

- [x] `ConversationListRow`/`MessageRow` ganham campos de nome (aditivos)
- [x] `listOrgMembers` exportada via `@crm/core/organizations`
- [x] Int tests ajustados + 1 assert novo (member list / names)

**Verification:** `pnpm --filter @crm/core test:integration` +
`typecheck`/`lint`. **Files:** `packages/core/src/modules/messaging/repository.ts`,
`packages/core/src/modules/organizations/{service,repository,index}.ts` + int
tests. **Scope:** M · **Deps:** none

## Task 2: Wrappers em `apps/web/src/server/services.ts`

**Description:** `listConversations(ctx, view)`, `getConversationDetail`,
`listConversationMessages`, `listOrgMembers`, `listTeams` — binding `getDb()`.

**Acceptance criteria:**

- [x] Páginas nunca importam `@crm/core`/db direto (regra eslint mantida)

**Verification:** typecheck. **Scope:** S · **Deps:** T1

## Task 3: `/app/inbox` — views + lista

**Description:** 4 abas como links `?view=queue|mine|inbox|resolved`
(server-filtered); itens com `#ticketNumber`, contato, status PT-BR,
assignee, setor, preview + `lastMessageAt`; `archived` sai do label map.

**Acceptance criteria:**

- [x] Cada aba chama `listConversations` com o view correto
- [x] Item linka pra `/app/inbox/[id]`

**Verification:** `next build` + lint. **Files:** `app/app/inbox/page.tsx`,
componentes ui (badge). **Scope:** M · **Deps:** T2

## Task 4: `/app/inbox/[id]` — header + thread + divisor

**Description:** Header (`#ticket` + `seq` + contato + status + assignee +
setor); thread unificada: inbound/outbound + notas (âmbar, "interna" +
authorName) + eventos de sistema (metadata.system=transfer → linha
discreta); divisor "Ticket anterior" linkando `precededById` quando
existir; 404 em id inválido/cross-tenant.

**Acceptance criteria:**

- [x] Notas e eventos visualmente distintos de mensagens
- [x] `notFound()` em NotFoundError

**Verification:** `next build` + lint. **Scope:** M · **Deps:** T2

## Task 5: Actions bar + transfer picker (client)

**Description:** Client component com botões por estado — Assumir (queue),
Transferir (select de membros/setores + confirm), Resolver, Aguardando /
Em atendimento, Reabrir (resolved) — chamando Server Actions; erros em
toast PT-BR; viewer não recebe o island.

**Acceptance criteria:**

- [x] Cada ação usa a action certa e mostra `error` em sonner
- [x] Viewer: sem island; agente sem ownership vê o estado (TICKET_ASSIGNED
      vira erro tratado)

**Verification:** build + lint + smoke. **Scope:** M · **Deps:** T4

## Task 6: Composer Responder/Nota interna (client)

**Description:** Toggle Responder/Nota → `sendOutboundMessageAction` /
`addInternalNoteAction`; pending state; textarea; desabilitado em
resolved com hint "Reabra o ticket"; viewer não vê.

**Acceptance criteria:**

- [x] Resposta → outbound via provider; Nota → privada (nunca sai ao
      cliente)

**Verification:** build + lint + smoke. **Scope:** M · **Deps:** T5

## Task 7: Docs + smoke

**Description:** `TODO.md` (slice 3 entregue; slice 4 = settings/teams UI +
campo da janela); nota UI em `domain-model.md` se convencionar algo;
smoke manual das views/ações.

**Verification:** gate completo (`format:check && typecheck && lint && test`

- int verdes). **Scope:** S · **Deps:** T6
