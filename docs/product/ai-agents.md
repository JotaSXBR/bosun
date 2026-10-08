# AI agents

## v1: observer only

The v1 AI **never writes to the customer and never drafts replies**. It is
a passive observer: it watches how the org's humans handle conversations
and proposes _configuration_ improvements — the selliq "monitoring mode".

**Trigger**: when a conversation is resolved (+ a manual "analyze now"
button in settings). Proposed default; a daily batch is the fallback if
token cost becomes an issue.

**Pipeline**: conversation resolved → `process-channel-event`-style Trigger
task (observer) → reads transcript + current agent/KB config → emits
`agent_suggestions` (pending) → notification surfaces them in a
**suggestions inbox** (settings area) → human approves or rejects with the
AI's rationale visible. Approving applies the payload diff to the target
entity (agent config, knowledge entry, memory, tool config). Nothing lands
without review — same contract as fazer.ai's knowledge-base approval.

BYOK applies to the observer too: **no org LLM key → observer silently
off** for that org (log, don't error).

## Agents (entity, exists as config even in v1)

Multiple specialized agents per org — examples from references: SDR,
scheduling, rescheduling, follow-up, closer, CS, reviewer. Per-agent config:
name, specialty, status, model ref, personality/system prompt, business
rules, tools allowlist, availability window, memory token cap, tool
execution limit, signature line. Observer suggestions target exactly these
fields — that is the whole point of modeling them now.

## BYOK + fallback

`org_llm_credentials`: provider (`openai`, `anthropic`, `gemini` at launch;
**OpenRouter** later for payload versatility) + encrypted key + priority.
The resolver walks the priority chain on failure — provider reserva is a
first-class concept. Every call records `ai_usage_events` (tokens in/out)
so spend caps and Langfuse-style reporting can land later without
re-instrumenting.

## Tool catalog (reference — implement per need, not upfront)

From the questionnaire; they become `defineAgentTool` entries as features
ship. Grouped:

- Conversation ops: `handoff_to_human`, `resolve_conversation`,
  `skip_reply`, `private_note`, `set_labels`, `set_custom_attribute`,
  `open_case_in_inbox`, `react_to_message`, `set_voice_preference`
- CRM: `create_lead`, `update_contact`, `kanban_create_card`,
  `kanban_update_card`, `kanban_move_card`, `update_kanban_task`,
  `move_deal_stage`
- Messaging out: `send_image`, `send_link`, `send_audio` (TTS, later)
- Lookup/data: `consultar_cep` (BrasilAPI), `inventory_lookup`,
  `faq_lookup`, `knowledge_base`, `calculator`, `get_current_time`
- Google (needs `external_connections` OAuth): `google_calendar_find_slots`,
  `google_calendar_create_event`, `gmail_send`
- `custom_tool` — user-configurable, later

## Memory

**Second brain (delivered)** — `memory_entries` stores internal
operational learning per org (never customer-facing; `knowledge_entries`
keeps that role). Two layers: staging = pending `agent_suggestions` with
`target_type = 'memory'` (proposed by the observer on conversation
resolve, or by a human via `/app/settings/ai`); canon = approved rows.
Four-eyes: the proposer can't self-approve, except the owner (sovereign
in single-person orgs). Entries carry type (8-value taxonomy), scope
(org/team/contact — contact links the row, never PII in content),
confidence, `sources` provenance, `stale_after` freshness and a
`superseded_by` temporal chain (updates retire the old row, nothing is
edited in place). A daily `brain-stale-sweep` job flags expired canon as
`stale`; humans renew or archive — the system never kills memory alone.
The observer reads canon + pending contents into its prompt
(search-before-write: no re-proposals, `supersedes` to replace facts)
and may emit up to 3 memory proposals per analysis. Agents get
`brain_access`/`brain_types` config columns now; runtime consumption
arrives with active agents. Per-contact conversation summaries (below)
remain roadmap.

Per-contact memory (roadmap): on resolution, a summary (contacts data,
agreements, pending items) replaces raw history for the agent's future
context — configurable token ceiling (fazer.ai model). The
`ai_usage_events` + suggestion flow exist so this drops in cleanly.

## Explicitly NOT v1 (roadmap, in priority order)

1. Draft suggestions in-conversation (private note → approve/edit/reject)
2. AI triage → sector routing (entity already supports it)
3. Transcription of inbound audio; TTS replies; split replies + typing
   pauses; message debounce
4. Autonomous mode + guardrails (toxicity, competitor mentions, custom
   policies, template-only replies)
5. Proactive messages / follow-up cadences; 24h WhatsApp window policy
6. RAG knowledge base retrieval; inventory/catalog; documents (quotes,
   receipts)
7. External MCP servers; secrets vault; per-turn execution logs UI;
   spend cap enforcement; "skills that configure the whole platform" —
   the dream item, revisit when the agent surface is real
