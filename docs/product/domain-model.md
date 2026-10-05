# Domain model

Status legend: **implemented** ships today · **spec** agreed in the
questionnaire/interview, not built yet.

## Platform & tenancy (flat)

| Entity                                           | Status             | Notes                                                                                                                                                                              |
| ------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`, `sessions`, `accounts`, `verifications` | implemented        | Better Auth. A user may belong to many orgs; `activeOrganization` in session picks the tenant.                                                                                     |
| `organizations` + members/invitations            | implemented        | The tenant. Future columns: `logo_url`, `theme` (jsonb), `custom_domain` (nullable unique — reserved).                                                                             |
| `platform_admin` role                            | implemented        | `superadmin@crm.local` — the VPS operator. Cross-tenant via `withPlatformScope` only after admin check.                                                                            |
| Org roles                                        | implemented        | `owner`, `admin`, `manager`, `agent`, **`viewer`** (read-only, no billing).                                                                                                        |
| `organization_settings`                          | implemented (base) | Per-org settings: `business_hours` (jsonb, customizable), `off_hours_message` (with `{proximo_atendimento}` placeholder), locale/timezone. The off-hours auto-reply is still spec. |

## Teams / sectors — implemented

`teams` (id, org, name, color) + `team_members` (org, team_id, user_id —
`organization_id` denormalized so the standard tenant predicate applies).
A sector exists as a real entity — the AI triage routes conversations **to a
sector**, and statuses show "time responsável". Sectors do NOT assign
agents automatically; a human still picks conversations manually.
Management UI is deferred to the P2 Settings item.

## Messaging — implemented, needs extension

`contacts`, `conversations`, `messages`, `channel_connections` exist.
`conversations.sector_id`/`assignee_id` and the lifecycle below are
implemented; `archived` was removed (folded into `resolved`). The
assignment/transfer actions and queue views are still to come.

Conversation lifecycle (implemented):

| Status (enum)      | Meaning                                                 | Responsible |
| ------------------ | ------------------------------------------------------- | ----------- |
| `open`             | In the queue (Fila) or routed to a sector, no agent yet | —           |
| `in_progress`      | An agent is handling it                                 | agent       |
| `waiting_customer` | Agent replied, waiting on the customer                  | agent       |
| `resolved`         | Done                                                    | sector      |

Derived views (not statuses): **Fila** = `open` + `assignee_id IS NULL`
sorted by oldest waiting (wait time = last inbound message); **Aguardando
atendimento** = `open` + `sector_id` set (routed, awaiting pickup);
**Minhas** = `assignee_id = me`; **Resolvidas**.

`conversations.sector_id` (FK teams, nullable) and `assignee_id` (FK users,
nullable) exist. Status transitions: manual pickup, transfer (sector/agent),
resolve (all pending — actions/UI slices); inbound message on `resolved`
reopens to `open` (implemented); inbound while `waiting_customer` →
`in_progress` (implemented).

`messages.private` exists — internal notes invisible to the client (team
notes, handoff context, later AI suggestions). The note-writing action is
still to come.

## Leads / funil — spec

Contacts are NOT leads: converting a conversation into a deal is a human
(or later AI-tool) decision — friends, family and returning customers share
the inbox.

| Entity                 | Fields (essence)                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `funnels`              | org, name, `template_ref` (niche template it was seeded from)                                                         |
| `funnel_stages`        | funnel, name, position, color                                                                                         |
| `deals` (kanban cards) | org, funnel, stage, contact FK, conversation FK (nullable), title, `value_cents`, position, `custom_attributes` jsonb |
| `labels` + join        | org, name, color; applied to conversations and deals                                                                  |

Multiple funnels per org; stages fully customizable (and AI-tool
editable later); **predefined stage templates per business niche**
(seeded declaratively). Lead custom attributes live in
`custom_attributes` jsonb; Google People/Contacts sync maps the
niche-relevant subset — see `external_connections` below.

## AI — spec (see ai-agents.md)

| Entity                | Purpose                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents`              | Per-org AI agents with specialties: name, role, status, `model_ref`, system prompt/personality, tools allowlist, availability, memory token cap, tool exec limit, signature. |
| `agent_suggestions`   | Observer output: type (`agent_config`, `knowledge_entry`, `memory`, `tool_config`), pending/approved/rejected, payload diff, rationale, reviewer.                            |
| `knowledge_entries`   | Org knowledge base; entries proposed by the observer land `proposed` until approved.                                                                                         |
| `org_llm_credentials` | BYOK: provider + encrypted key + priority → fallback chain (reuses `CHANNEL_CREDENTIALS_KEY` encryption).                                                                    |
| `ai_usage_events`     | Token usage per call (org, agent, provider, model, in/out, kind) — foundation for spend caps.                                                                                |

## External connections — spec (foundation only)

`external_connections`: org, provider (`google`, ...), encrypted tokens,
scopes, external account id, status. The OAuth **flow** is deferred —
endpoints ship with the first Google feature (Contacts sync, Calendar,
Gmail tools). Table only.

## Billing — implemented

`billing_customers`, `billing_subscriptions`, `billing_payments`,
`billing_webhook_events` exist. Model: flat plan, no seat/connection
limits; **metered only: storage** beyond 500 MB free (measured per org,
billed per GB — measure first, decide block-vs-bill later);
**BYOK means LLM cost is the tenant's**, not the platform's.
Trial: 7 days.

`usage_counters` (spec): org, metric (`storage_bytes`), value, updated —
feeds the storage charge.

## Channels

| Channel                        | Status                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| WhatsApp via WAHA / Meta Cloud | implemented (providers)                                                                              |
| Site chat widget               | spec — **next channel**; embeddable widget, anonymous visitor sessions, public rate-limited endpoint |
| Instagram / Facebook           | spec (Meta adapter reuse)                                                                            |
| E-mail                         | spec (provider choice deferred)                                                                      |
| Telegram                       | later                                                                                                |
