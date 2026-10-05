# Roadmap

## Skeleton milestone (agreed)

> A real WhatsApp message arrives via webhook → appears in the inbox in
> realtime → a human agent picks it up and replies → the reply goes out
> through the channel → the conversation can become a lead in the funnel →
> the org sees its subscription/billing basics.

Done when that flow works end-to-end on a dev machine. Below the fold,
product order from the founder: **integrations → multi-attendance → AI
agents → leads/sales → activities → settings**.

## Phase status

| Phase                | Contents                                                                                                                                                       | Status                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Foundation           | monorepo, auth, tenancy+RLS, providers, docs (Trigger.dev → pg-boss pendente, ver TODO)                                                                        | ✅ done                |
| Integrations         | `channel_connections`, encrypted creds, webhook ingest, `/app/integrations`                                                                                    | ✅ done                |
| Messaging core       | contacts/conversations/messages, idempotent ingest                                                                                                             | ✅ done                |
| Realtime             | SSE inbox via LISTEN/NOTIFY                                                                                                                                    | ✅ done                |
| Billing base         | ASAAS webhook + tables                                                                                                                                         | ✅ done                |
| **Multi-attendance** | teams/sectors, conversation status+assignee, queue views, private notes, conversation page + outbound send, business hours + off-hours auto-reply, viewer role | next                   |
| **Site chat**        | widget channel (validates abstraction without third-party API)                                                                                                 | after multi-attendance |
| **AI v1: observer**  | org LLM creds (BYOK+fallback), agents entity, `agent_suggestions`, `knowledge_entries`, observer task, suggestions inbox + notification, `ai_usage_events`     | then                   |
| **Leads & funil**    | funnels/stages/deals, labels, custom attributes, conversation→deal, kanban UI, niche templates                                                                 | then                   |
| **Activities**       | tasks on contacts/deals/conversations                                                                                                                          | then                   |
| **Settings**         | org branding (logo/theme), business hours UI, billing/plan UI, storage usage                                                                                   | then                   |
| i18n                 | `next-intl`, PT-BR strings (cross-cuts next phases)                                                                                                            | with multi-attendance  |
| Storage metering     | `usage_counters`, quota read                                                                                                                                   | with settings          |

## Explicitly out of the skeleton

Broadcast campaigns (v1 — Meta templates + WAHA ban risk), custom client
domains, Google OAuth flows (table only), autonomous AI / drafts /
guardrails / transcription / follow-up cadences / RAG / MCP / vault,
agency tenant hierarchy, Redis rate-limit (single instance), email
channel provider choice.

## After the skeleton

Per `docs/product/ai-agents.md` roadmap order: drafts → triage → audio →
autonomous+guardrails → proactive/follow-up → RAG/tools-heavy agents.
And the dream item — agents/skills that configure the platform itself —
revisit once the agent surface is real.
