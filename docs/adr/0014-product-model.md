# 0014: Product model — flat tenancy, sector entity, observer-first AI

Status: accepted

## Context

Founder questionnaire + interview (docs/product/questionario.md,
2026-10-03) defined the product model the architecture must serve:
multi-tenant SaaS for Brazilian service businesses; self-hosted by a
platform operator; white-label per tenant; AI that starts passive.

## Decision

- **Flat multi-tenancy.** One install, N organizations; users switch the
  active org in-session (Better Auth already does this). No tenant
  hierarchy — resold clients are additional tenants. Custom client
  domains deferred; `organizations.custom_domain` reserved; tenant
  resolution stays session-based until host-based lookup is needed.
- **"Fila" is a view, not an entity.** Conversations gain `sector_id` +
  `assignee_id` + status enum
  `open|in_progress|waiting_customer|resolved`; the queue is
  `open AND assignee_id IS NULL` ordered by wait time.
- **Sector/team is an entity** (`teams` + `team_members`) — AI triage and
  status ("time responsável") both reference it.
- **AI v1 = observer only.** No drafts, no autonomy: a resolved-conversation
  hook produces `agent_suggestions` that humans approve/reject in a
  suggestions inbox, notified via the existing SSE domain-event channel.
- **BYOK LLM keys per org** (`org_llm_credentials`, same AES-256-GCM
  encryption as channel credentials) with a **priority fallback chain**;
  OpenAI+Anthropic+Gemini at launch, OpenRouter later. `ai_usage_events`
  records every call's tokens for future spend caps.
- **Conversa → lead is manual.** Deals/funnels are separate entities;
  multiple funnels with customizable stages seeded from niche templates.
- **Site chat widget** is the second channel (validates the provider
  abstraction without third-party APIs); Instagram/Facebook/email follow.
- **`next-intl` from now**, PT-BR strings centralized.
- **Flat billing + storage metering** (500 MB free, then per GB) +
  7-day trial. LLM cost is the tenant's (BYOK).
- **`viewer` role** added: read-only, no billing.
- **Google OAuth foundation table** (`external_connections`) ships without
  the OAuth flow — endpoints arrive with the first Google feature
  (Contacts sync). Flow-without-consumer would be dead code.

## Consequences

- Conversation/`messages` schema must evolve (status enum, sector,
  assignee, `private` flag) — one migration covers the multi-attendance
  phase.
- AI work is gated on org LLM credentials; observer degrades gracefully
  to "off" without a key.
- i18n wraps all new UI strings; existing PT-BR strings get extracted.
- Product backlog in TODO.md reprioritized to match the founder's order:
  multi-attendance → site chat → AI observer → leads/funnel → activities
  → settings.

## Alternatives considered

- Tenant hierarchy (agency → sub-orgs): rejected — real "resale" need is
  branding only; hierarchy is invasive and can be added later if proven.
- Autonomous AI in v1: rejected by founder — observer-first builds trust
  and generates config suggestions from real conversations.
- Draft-suggestion mode in v1: deferred to roadmap step 1 after observer.
- Subdomain-per-tenant now: rejected — session tenancy suffices; wildcard
  DNS is cheap when wanted.
- OAuth flow skeleton without a consumer: rejected — dead endpoints.
- Round-robin auto-assignment: rejected — manual pickup is the rule.
