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
- **Reopen**: inbound message on a `resolved` conversation reopens it to
  `open` (provisional: keeps previous sector, drops assignee).
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
