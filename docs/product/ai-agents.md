# AI agents

## Vision

"Start with AI off while it learns your DNA." The customer's humans keep
answering conversations exactly as before; the AI is configured but
silent toward leads, watching. Every resolved conversation is a chance
to learn how this org handles objections, what language it uses, what
works — that learning compounds in the second brain. When the org turns
the AI on, it arrives already shaped by the business, not generic.

The product posture progresses through three stages — each still keeps
humans in control of anything customer-facing:

| Stage                     | What the AI does                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Passive** (v1)          | Observes resolved conversations → proposes operational learnings and knowledge entries. Never touches a live thread.    |
| **Assisted** (this slice) | Proposes _draft replies_ inside open conversations — a human approves, edits, or rejects. Still never sends on its own. |
| **Autonomous** (roadmap)  | Sends replies by itself within guardrails and its own schedule. Earned, not default.                                    |

## The agent model

Two kinds of agents, deliberately different:

- **System agents** — platform-owned capabilities every org gets. The
  **observer** is the only one today; reviewers (Revisor do Time,
  Revisor de Leads) join later. Configurable (prompt, model, tools) by
  the **org owner only** — powerful enough to deserve tighter control
  than `ai:manage`.
- **Org agents** — entities the org owns and tunes (`ai:manage`). The
  **drafter** is the first; specialists (SDR, Agendamento, etc.) come
  with autonomous mode.

Agents reach each other through **agent-as-tool**, not direct chat:
an agent calls a tool (`request_draft`) which internally runs the
callee agent's full pipeline (its own prompt, model, tools) and returns
the result. The caller decides _whether/when_; the callee owns _how_.

The alternative — and the right default when there's no conversation
context to weigh — is an **independent trigger**: reviewers will run on
their own schedules/events (weekly team review, lead stage change) and
emit `agent_suggestions` directly, with no observer pass in between.
Rule of thumb: a decision about _this conversation right now_ goes
through the observer's tools; a decision about _timing/aggregate state_
gets its own trigger.

## Observer

The observer watches and proposes. It is a triggered job (pg-boss)
running an LLM with a tool allowlist that bounds what it may emit:
`brain_search` / `memory_propose` (brain read/write), `propose_knowledge`,
`request_draft`. **Every output is a pending `agent_suggestion`** —
nothing lands without human review.

**Modes** (per-org `ai_observer_mode`; default `on_close` for new orgs
— "off" AI still learns; `off` for orgs without BYOK):

| Mode       | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `off`      | No LLM calls on its own. Manual draft buttons still work (explicit click = conscious spend).                                                                                                                                                                                                                                                                                                                                                                |
| `on_close` | Ticket resolved → observer analyzes → brain/knowledge proposals.                                                                                                                                                                                                                                                                                                                                                                                            |
| `interval` | Every N minutes (per-org, default 15), deterministic scan — **no LLM**: open tickets assigned to humans where the last message is inbound and the human has been idle past the threshold (per-org, default 15 min) → emits a **nudge card** in the thread ("client waiting — generate a suggestion?") whose action calls the drafter on demand. Org flag `auto_draft` upgrades the scan to an observer run → `request_draft` (full draft instead of nudge). |
| `realtime` | Every inbound → observer run (debounced to coalesce bursts — fazer.ai/agents as reference) → observer **decides from brain/knowledge whether a draft is warranted**; if so, `request_draft` → draft card. A run does not guarantee a draft. Most expensive; settings show a cost warning.                                                                                                                                                                   |

**Business hours (note)**: human working hours and the pre-programmed
away reply are separate backlog (settings P2); AI-hours become a second
schedule with autonomous mode. The v1 scan ignores hours — drafts are
human-approved, so scanning outside hours costs nothing but leaves
nudge cards waiting. When business-hours lands, the scan honors
"humans available" and autonomous mode gets its own schedule.

**Pipeline**: trigger per mode → observer task → reads transcript +
agent/KB config → emits `agent_suggestions` (pending) → surfaced where
they apply (settings inbox for config/brain/knowledge, in-conversation
card for drafts) → human approves or rejects with rationale visible.
Approving applies the payload diff (or sends the draft). Same contract
as fazer.ai's knowledge-base approval.

BYOK applies: **no org LLM key → observer silently off** (log, don't
error); manual draft buttons show a disabled state instead.

## Second brain — how the system learns

`memory_entries` is the org's **operational memory**: things the system
learned watching this team work — "we handle price objections with X",
"this customer prefers WhatsApp over calls". Never customer-facing
(`knowledge_entries` keeps that role); it exists so every future AI
decision in this org starts smarter than generic.

The learning loop:

```
resolved conversation
  → observer proposes learnings (≤3 per analysis, staged)
  → human approves in the settings inbox
  → canon entry
  → injected into future AI prompts (observer today; drafter and
    live agents as they ship)
  → expires → human renews or archives
```

Mechanics, briefly:

- **Staging → canon**: proposals live as pending `agent_suggestions`
  (`target_type = 'memory'`); approval promotes to `memory_entries`.
  Four-eyes: the proposer can't self-approve — except the owner
  (sovereign in single-person orgs).
- **Scope**: `org` / `team` / `contact` — who the learning applies to.
  Contact-scoped rows link the contact but carry no PII in `content`.
- **Type**: 8-value taxonomy (objection handling, tone, …); plus
  `confidence` and `sources` provenance.
- **Freshness**: `stale_after` → daily `brain-stale-sweep` flags expired
  canon; humans renew or archive — the system never deletes memory on
  its own. Updates never edit in place: a new entry supersedes the old
  (`superseded_by` chain keeps history).
- **Search-before-write**: the observer reads canon + pending contents
  into its prompt and won't re-propose what exists — it `supersedes`
  to correct facts.

**Consumption model** — the brain is a tool surface, not a fixed prompt
dump (baalda-shaped: agents read/write it like a teammate):

- **Core injected** (every agent prompt): org-scope canon ∩ the agent's
  `brain_types`, capped (~8 entries) — the lean "how this house works"
  block. Prompt layout for cache: `[tools defs — static]` →
  `[system: agent config → brain core → datetime marker (~30 min
refresh)]` → `[messages — volatile transcript]`. Most-stable first:
  brain is more stable than the clock (empty at onboarding, grows,
  stabilizes), so it sits before the datetime marker and only its
  small tail re-processes on each tick.
- **`brain_search` tool** (per-agent allowlist): the broad brain on
  demand — team/contact-scoped and excluded-type entries reachable when
  `brain_access` allows. v1 searches the existing pt-BR FTS; embeddings
  stay roadmap (knowledge RAG stack is a separate open decision).
- **Access tiers**: observer + future copilot get `brain_access` full
  (the analysts need the whole); specialists like the drafter get the
  lean core + scoped search.

**Write path** — configurable per org (AI settings flag): default keeps
staging (`memory_propose` tool → pending suggestion → human approves);
the org can allow direct canon writes for trusted agents. Per-agent
override lands later if the single flag proves too coarse.

Delivered vs. dormant: today the observer receives canon via a fixed
fetch — this slice migrates it to the same tool surface
(`brain_search` + `memory_propose`), unifying the model. `agents` rows
carry `brain_access`/`brain_types` columns that this consumption model
activates — informed drafts are the point of learning first.

Per-contact memory (roadmap): on resolution, a summary (contacts data,
agreements, pending items) replaces raw history for future context —
configurable token ceiling (fazer.ai model). `ai_usage_events` + the
suggestion flow exist so this drops in cleanly.

## Draft suggestions (module `ai-drafts`)

**Drafter** = a dedicated org agent (own prompt/persona/model/rules,
`ai:manage`). It is the **only text generator**: manual buttons and
observer `request_draft` calls both go through the same service — the
observer decides _when_, the drafter writes _what_.

A draft is an `agent_suggestions` row (`target_type = 'draft'`,
`source_conversation_id`, payload `{ body }`). It renders **in the
conversation thread** as a distinct card (own color, AI-attributed —
not a plain private note; private notes keep their handoff/info role),
with three actions:

- **Aprovar** → sends immediately via `sendOutboundMessage` (human
  review already happened at approval).
- **Editar e enviar** → prefills the composer; the human edits and
  sends through the normal path.
- **Rejeitar** → dismisses the card.

**Manual triggers** (composer area, `messaging:write`):

- **Sugerir resposta** — drafter generates from the transcript.
- **Melhorar resposta** — drafter rewrites the current composer text.

**Permissions**: `messaging:write` for generate/approve/edit/reject.
Viewers never see draft cards or buttons.

**Lifecycle**: at most one pending draft per conversation — generating
again supersedes. A new inbound marks a pending draft `stale` (badge +
"regenerate" affordance; approval stays allowed — human judgment wins).
A nudge card is not a draft — it carries no text; "generate" produces
a draft card in place.

**Cost**: every generation records `ai_usage_events`. Manual click with
a pending draft asks to replace. Provider/key failure: manual trigger
shows a toast; automatic triggers skip silently (logged).

## Agents (entity config — shared shape)

Per-agent config (same shape for org agents; system agents reuse it
with owner-only editing): name, specialty, status, model ref,
personality/system prompt, business rules, tools allowlist,
availability window, memory token cap, tool execution limit, signature
line. Observer suggestions target exactly these fields — that is the
whole point of modeling them now.

## BYOK + fallback

`org_llm_credentials`: provider (`openai`, `anthropic`, `gemini` at
launch; **OpenRouter** later for payload versatility) + encrypted key +
priority. The resolver walks the priority chain on failure — provider
reserva is a first-class concept. Every call records `ai_usage_events`
(tokens in/out) so spend caps and Langfuse-style reporting can land
later without re-instrumenting.

## Tool catalog (reference — implement per need, not upfront)

From the questionnaire; they become `defineAgentTool` entries as
features ship. Grouped:

- Conversation ops: `handoff_to_human`, `resolve_conversation`,
  `skip_reply`, `private_note`, `set_labels`, `set_custom_attribute`,
  `open_case_in_inbox`, `react_to_message`, `set_voice_preference`
- CRM: `create_lead`, `update_contact`, `kanban_create_card`,
  `kanban_update_card`, `kanban_move_card`, `update_kanban_task`,
  `move_deal_stage`
- Messaging out: `send_image`, `send_link`, `send_audio` (TTS, later)
- Lookup/data: `consultar_cep` (BrasilAPI), `inventory_lookup`,
  `faq_lookup`, `knowledge_base`, `calculator`, `get_current_time`
- Google (needs `external_connections` OAuth):
  `google_calendar_find_slots`, `google_calendar_create_event`,
  `gmail_send`
- `custom_tool` — user-configurable, later
- Agent-as-tool: `request_draft` (observer → drafter); future:
  `request_team_review`, `request_lead_review`

The **copilot** is not the observer: copilot = future interactive
assistant surface (chat with the operator over tools — the roadmap
"dream item"). They share BYOK/tools/brain infra but differ in
lifecycle: observer is an async triggered job, the copilot a
request/response session.

Future agent taxonomy (reference — founder's diagram, informs triage
and autonomous phases): a **Classificador** routes into specialists —
SDR, Agendamento, Remarcação, Follow-up, Lembrete, Closer, CS — plus
reviewers (Revisor do Time, Revisor de Leads) running on their own
triggers. Not this slice.

## Roadmap (in priority order)

1. AI triage → sector routing (entity already supports it;
   Classificador above)
2. Transcription of inbound audio; TTS replies; split replies + typing
   pauses; message debounce tuning
3. Autonomous mode + guardrails (toxicity, competitor mentions, custom
   policies, template-only replies) + AI-hours schedule; specialist
   agents + reviewers (Revisor do Time / Revisor de Leads)
4. Proactive messages / follow-up cadences; 24h WhatsApp window policy;
   the other passive-mode outputs from the vision (per-lead report,
   response time, team score, auto follow-up)
5. RAG knowledge base retrieval; inventory/catalog; documents (quotes,
   receipts)
6. Copilot surface; external MCP servers; secrets vault; per-turn
   execution logs UI; spend cap enforcement; "skills that configure
   the whole platform" — the dream item, revisit when the agent
   surface is real
