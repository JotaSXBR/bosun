# Implementation Plan: Multi-atendimento slice 3 — inbox operável

## Overview

Turn `/app/inbox` into the attendance console on top of the slice-2 domain:
4 server-filtered view tabs, a conversation page with a unified timeline
(messages + internal notes + system events), previous-ticket divider, a
Reply/Note composer, and lifecycle actions — all calling the existing
Server Actions. Everything is presentation except a thin data-surface
layer: names (assignee/sector/author/members) are not yet joined.

## Architecture Decisions

- **Server Components + `?view=` tabs**: tabs are plain links re-rendering
  the page server-side — no client state for views, URL is shareable.
- **Joins in the repository**, not in pages: `assigneeName`, `sectorName`,
  `authorName`, contact fields and the preceded-ticket number are data
  concerns; pages stay dumb.
- **`listOrgMembers`** (new organizations service fn): `organization_members
⋈ users` → `{userId, name, email, role}` for the transfer picker.
  Permission `messaging:read` (every attendee incl. viewer can read).
- **Client component only where needed**: actions bar + composer +
  transfer picker are one small client island calling Server Actions and
  toasting via `sonner`; the rest stays server-rendered.
- **New `@crm/ui` components**: `badge`, `textarea`, `select` (radix
  umbrella dep already installed). No dialog — transfer is an inline
  select + confirm button in the actions bar.
- **Display format**: list shows `#<ticketNumber>`; conversation header
  shows `#<ticketNumber>` + `contato-seq·ticket-seq` ("12-3") + opened
  date. PT-BR labels: `open` Na fila · `in_progress` Em atendimento ·
  `waiting_customer` Aguardando cliente · `resolved` Resolvido
  (`archived` label removed).
- **Viewer**: `ctx.role` gates the actions/composer client island; Server
  Actions still enforce `messaging:write`.

## Task List

### Phase 1: Data surface

- [ ] Task 1: Names + org members in domain queries
- [ ] Task 2: `services.ts` composition wrappers

### Checkpoint: Foundation

- [ ] `pnpm typecheck && pnpm lint` + messaging/orgs int tests green

### Phase 2: Inbox

- [ ] Task 3: `/app/inbox` — 4 view tabs + ticket list items

### Phase 3: Conversation

- [ ] Task 4: `/app/inbox/[id]` — header + unified thread + divider
- [ ] Task 5: Actions bar + transfer picker (client)
- [ ] Task 6: Composer — Responder/Nota interna (client)

### Checkpoint: Complete

- [ ] `format:check && typecheck && lint && test` green; `next build` ok
- [ ] Task 7: docs (TODO.md, domain-model UI notes) + manual smoke

## Risks and Mitigations

| Risk                                                  | Impact | Mitigation                                                                                                                     |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Joins change `ConversationListRow`/`MessageRow` types | Med    | Additive fields only; existing callers unaffected                                                                              |
| `select` radix component API mismatch                 | Low    | Umbrella `radix-ui` dep already installed; copy shadcn recipe                                                                  |
| Reopen button shown for expired window                | Low    | Always render on resolved; PT-BR error toast maps `REOPEN_WINDOW_EXPIRED`/`ACTIVE_TICKET_EXISTS` (server already returns them) |
| No e2e coverage of actions                            | Low    | Keep v1 e2e to smoke-level (inbox renders + open conversation)                                                                 |

## Open Questions

- None — decisions recorded in `.task-brief.md ## Contexto`.
