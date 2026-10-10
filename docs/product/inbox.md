# Atendimento inbox — operational queue

## Vision

The Atendimento area is the agent's daily workbench, not a ticket list.
References: DeskcommCRM (operational queue — tabs, discriminating badges,
snooze, archive), MariaOS (sectioned queue + contact panel + composer
power-ups, proven code from the same author), Synthor (product framing —
contact card always on the right, omnichannel inbox).

This spec covers **E1 — the operational queue**. Follow-up slices are
listed under Non-goals and get their own spec/plan when prioritized.

## Layout

`/app/inbox` becomes a master-detail workbench — three columns:

```
┌─────────────┬──────────────────────┬────────────────┐
│ Queue list  │ Thread + composer    │ Right panel    │
│ (~360px)    │                      │ (ticket/lead)  │
└─────────────┴──────────────────────┴────────────────┘
```

- Clicking a row selects the conversation in place — no page navigation.
- `/app/inbox/[id]` stays as a deep link and redirects to
  `/app/inbox?c=<id>` so every surface is one canonical route.
- The right panel reuses the existing complementary column
  (ticket actions + lead panel). The full contact ficha is E2 and drops
  into this slot without layout changes.
- Below `lg`: list ↔ thread toggle via the `c` param; aside hidden.

## Tabs

| Tab        | Rule                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| Automático | `status='pending'` — intake-mode pending (planned; empty until intake ships) |
| Fila       | `open` + unassigned + not snoozed — needs a human                            |
| Minhas     | assigned to me, active statuses, not snoozed                                 |
| Todas      | every active conversation, not snoozed                                       |
| Adiados    | `snoozed_until > now()`                                                      |
| Fechadas   | `resolved` + `closed`                                                        |

Decisions:

- **"Fechadas", not "Arquivadas"** — Bosun's `closed` already means
  "removed from the work queue without being destroyed"; a separate
  archived state adds nothing the vocabulary needs.
- **"Automático" is `pending`** — the planned intake state. The tab is
  always visible (agents learn where it lives before intake ships) with
  an honest empty state.
- Tab counters on every tab.

## Sections (Fila only)

`Fila` groups rows: **Entrada** (no sector) first, then one section per
sector. Other tabs are flat lists. Ordering inside the Fila: longest
wait first (`last_message_at` asc) — the ticket that waited longest is
the one the queue exists to surface. `Todas`/`Fechadas` sort by recency.

## Filters

- **Search** — contact name, channel user id (phone), ticket number.
- **Aguardando resposta** — last message is inbound. Replaces a real
  unread cursor (no per-user read state exists yet) and needs zero
  schema: `EXISTS` on the latest message direction.
- **Channel** — picker of connected `channel_connections`; **rendered
  only when the org has more than one connection** (a one-line filter on
  a one-channel org teaches the eye to ignore that row area).
- **Sector** — dropdown of the org's teams.

## Discriminating badges

A row only shows a marker when the marker discriminates:

- Channel logo: only when org has >1 connected channel.
- Assignee chip: only when the visible list mixes owners (never in
  `Minhas`, pointless in `Fila`).
- Sector chip: always (org has sectors or not — it's the routing truth).
- "Adiada até …" badge inside `Adiados`.
- Awaiting-reply dot on rows whose last message is inbound.

## Snooze

- `conversations.snoozed_until` (timestamptz, nullable).
- "Adiar" in the ticket actions menu: 1h, amanhã 9h, próxima semana.
- Snoozed rows leave Fila/Minhas/Todas and live in `Adiados`.
- Return is **lazy** — no sweep job: the expiry instant is the value
  itself, queries treat `snoozed_until <= now()` as active again. A
  "Retomar" action clears it early.

## Keyboard

Minimal for E1: `j`/`k` move selection in the list, `Enter` opens.
Richer shortcuts (take, resolve, snooze) arrive with E3 composer
power-ups.

## Non-goals (later slices)

- **E2** — right-panel contact ficha + Google-People-style cadastro
  (local-only, no People API sync yet) + conversation/contact tags.
- **E3** — composer power-ups: `/` macros, native right-click message
  menu, thread search, sendSeen on/off toggle.
- **E4** — "não virou negócio" attendance list (Synthor concept; pairs
  with observer nudges).
- Intake mode itself (what actually writes `status='pending'`).
- Per-user unread cursors, realtime list refresh beyond the existing
  SSE invalidate, transfer-request workflows, AI-attendance tab
  population.
