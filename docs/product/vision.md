# Vision

## Who

Liberal/informal professionals and SMB service companies (services, sales,
support, customer care) — Brazil-first. A solo professional and a 20-agent
operation are both valid tenants.

## Problem (one sentence)

Win back time in customer service and lead management by automating
repetitive work and centralizing conversations, so humans focus on solving
problems and closing deals.

## Product shape

Multi-tenant SaaS: one installation, many organizations. The person who
installs it on a VPS is the **platform operator** (`platform_admin`); each
customer company is a **tenant** with its own branding (white-label),
channels, funnels and AI configuration. A user may belong to several orgs
and switches the active one in-session — tenancy is flat (no agency
hierarchy; resold clients are just more tenants).

## Reference products (what to borrow)

- **selliq.io** — guided onboarding (zero → working agent), passive
  observer mode before trusting the AI, multi-agent specialists with
  reviewers, follow-up cadences, smart scheduling, feedback-driven learning.
- **synthor.cloud** — inbox layout: conversation list + thread + right
  sidebar with lead/contact data.
- **fazer.ai agents** — agent config surface: availability windows, message
  debounce, voice transcription/TTS, split replies, signature, context
  attributes, memory with token cap, tool execution limits, 24h WhatsApp
  policy, input/output guardrails, audit trail, per-turn execution logs,
  spend caps, MCP servers, secrets vault, off-hours auto-reply.
- **helena crm** — general CRM inspiration.

These are directional references, not specs to copy. See `ai-agents.md` for
what of this lands when.

## Differentiators (per founder)

- Observer-first AI: the platform learns how the org's humans work and
  proposes configuration — nothing is auto-applied without approval.
- Flat pricing; the tenant brings their own LLM key (BYOK).
- White-label deep enough to resell (logo/name, theme, custom domain later).
