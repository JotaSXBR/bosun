# Todo — Contatos manuais + conversa outbound-first

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Phase 0 — Extras

- [x] **T1 — rename `@crm/ui` → `@crm/design-system`**
  - package.json (design-system + apps/web dep), ~260 imports,
    `next.config.ts` transpilePackages, `components.json` ×2,
    `design-system/tsconfig.json` paths, `tooling/eslint/design-system.js`,
    `pnpm install` (lockfile), refs em docs markdown
  - Verificação: typecheck + lint verdes; grep `@crm/ui` = 0 em código

- [x] **T2 — `ci.yml`: `CHANNEL_CREDENTIALS_KEY` de teste**
  - Já existia (`env:` global, 64 hex fixa, padrão `BETTER_AUTH_SECRET`) —
    entrada do TODO estava desatualizada; corrigida.

## Phase 1 — Core

- [x] **T3 — módulo `@crm/core/contacts`**
  - `phone.ts` (`+<país>` estrito → `digits@c.us`), `schemas.ts`,
    `repository.ts` (insert-or-get, list paginado c/ contagem de tickets,
    findById), `service.ts` (`createContact` messaging:write,
    `listOrgContacts`/`getContact` messaging:read), export `./contacts`
  - Unit: 5 testes phone · Int: 6 testes (dedup, RLS, viewer, list)

- [x] **T4 — `startOutboundConversation` (messaging)**
  - `findOrCreateTicket` += `assigneeId?`/`status?`; `outbound-first.ts`
    com guards WAHA-only/connected/`@c.us|@lid`; ticket `in_progress` +
    assignee=caller + `conversation.created`; `{conversation, created}`
  - Int: 7 testes (guards, redirect p/ ativo, RLS, viewer)

## Phase 2 — App

- [x] **T5 — services + actions**
  - `listContactsPage`, `listWahaConnections` em `services.ts`;
    `actions/contacts.ts` com `createContactAction` +
    `startOutboundConversationAction`

- [x] **T6 — `/app/contacts` + `NewContactDialog` + nav**
  - página server-filtered `?q=`, lista c/ tickets count + e-mail,
    empty states; header actions (Nova conversa / Novo contato, só
    `messaging:write`); módulo "Contatos" (ícone `users`) no shell/paleta;
    strings `contacts.*` + `nav.contacts`

- [x] **T7 — `NewConversationDialog`**
  - contato (busca/cria inline) + select WAHA → action →
    `router.push(/app/inbox/[id])`; botão no header do inbox (só
    `messaging:write`) e por linha em `/app/contacts` (só contatos
    WhatsApp)

- [x] **T8 — "criar contato" inline no `ContactSelect` (deal form)**
  - `ContactSelect` extraído p/ `components/contact-select.tsx` com
    `onCreateClick`; deal form abre `NewContactDialog` e seleciona o id

- [x] **T9 — e2e `contacts.spec.ts`**
  - sign-up → /app/contacts → criar contato → lista/busca → dialog
    outbound sem WAHA → deal form cria contato inline → deal criado ✅

## Checkpoint final

- [x] `pnpm format` + `pnpm lint` (0 erros) + `pnpm typecheck` +
      `pnpm test` (165) verdes
- [x] Int messaging+contacts: 13 testes verdes · e2e contacts: 1 verde
- [x] TODO.md atualizado
- [ ] `pnpm build`
- [ ] Commit Conventional → push → CI verde
