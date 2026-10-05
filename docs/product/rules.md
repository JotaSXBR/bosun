# Business rules

Agreed in the questionnaire/interview (2026-10-03). Items marked
**(provisional)** are defaults I proposed — revisit before shipping them.

## Atendimento

- **Fila is a view**, not an entity: open conversations with no assignee,
  oldest-waiting first.
- **Assignment is manual** — an agent picks a conversation from the queue.
  No round-robin, no auto-assign in v1.
- **Sectors route, humans pick**: AI triage (when enabled) sets `sector_id`;
  pickup is still manual.
- **Tickets, not threads**: `resolved` is terminal **for the customer**. A
  new inbound on a resolved chat opens a **follow-up ticket**
  (`preceded_by_id`) — fresh queue, no sector/assignee carry-over. Agents
  can also create a follow-up explicitly (`resumeTicket`).
- **Ownership**: a ticket in attendance belongs to its assignee — working
  actions (reply, note, waiting, in_progress, resolve, pickup) on someone
  else's ticket are rejected (`TICKET_ASSIGNED`). Ownership changes only via
  `transferConversation` — the explicit, audited path for covering an absent
  agent; every transfer writes a private system note in the ticket timeline
  (`metadata.system: "transfer"`), visible to operators, never to the
  customer.
- **Reopen (undo)**: any agent may reopen a resolved ticket within
  `ticket_reopen_window_hours` (default 48h, per-org) — the "closed by
  accident" escape. Impossible once a follow-up is active; past the window
  the ticket is effectively closed (a real `closed` status waits for the
  jobs layer). Reopening keeps the assignee and clears resolution stamps.
- **Ticket numbering**: global per org (`#47`) + per-contact sequence
  (`12-3` = contact 12's 3rd ticket) + date.
- **Reply assigns**: sending an outbound reply moves the ticket to
  `waiting_customer` and auto-assigns the sender when unassigned (it never
  steals an assigned ticket).
- **Customer reply** while `waiting_customer` → back to `in_progress`
  (provisional).
- **Conversa → lead is a human decision** — never automatic.

## Horário de atendimento

- Business hours are **per-org, customizable** (`organization_settings`).
- Outside hours: one automatic reply per conversation per day —
  "Estamos fora do horário de atendimento. Voltamos
  {proximo_atendimento}." No AI/agent pickup until return.

## Papéis

`owner`, `admin`, `manager`, `agent`, **`viewer`** (read-only everything,
no billing). Sector-scoped agents (see only their sector) are a future
refinement, not v1.

## Billing

- Flat plan, unlimited seats/connections.
- Metered: storage beyond **500 MB free**, per GB (provisional: measure and
  bill, do not hard-block uploads).
- **Trial: 7 days** (provisional: after trial, org degrades to read-only
  until first payment — confirm the desired behavior).
- LLM usage is BYOK — the tenant's key, the tenant's bill.

## White-label

- v1: logo + name + theme per org (tenant resolution stays session-based).
- Wildcard subdomain per tenant (`acme.seudominio.com`): cheap, when wanted
  — wildcard DNS + wildcard cert, proxy reads Host.
- Custom client domain (`crm.cliente.com.br`): later — needs host→org map
  (`organizations.custom_domain` reserved) + on-demand TLS.

## LGPD / compliance

- Brazilian rules apply. Implications to build as they become needed:
  export a contact's data, delete a contact's data on request, retention
  policy, consent signals on outbound. The audit trail (`audit_logs`)
  already records admin changes — extend to data-subject requests.

## Language / UI

- UI is **PT-BR**, built on `next-intl` from day one so a second locale is
  a translation file, not a refactor.
- Visual style: clean/minimal; founder provides the design system later.
  Until then, functional layout only — inbox follows the synthor-style
  three columns (list | thread | contact/lead sidebar).
