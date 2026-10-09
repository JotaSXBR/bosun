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

## Brand concept — BOSUN (design system, 2026-10-08)

The design system (`DESIGN.md`, `design-system/`) carries the long-term
concept of the product. Customer operations (inbox, deals, integrations, AI
agents) is the first set of modules of a broader idea:

- **Positioning:** "Seu mundo digital, sob comando." — a modular **work
  environment on the web** ("sistema operacional de trabalho na web" as a
  concept only: it runs in the browser, nothing to install, it never replaces
  the computer's OS). "Ferramentas dispersas viram um ambiente de trabalho
  conectado."
- **Metaphor:** the bosun (_contramestre_) turns the captain's direction into
  coordinated daily execution. The user sets the course; the platform
  coordinates tools, flows and people.
- **Pillars** (the bar every module is judged against):
  - **Clareza** — show what matters and what the next action is.
  - **Coordenação** — connect capabilities, don't just place them side by side.
  - **Autonomia** — each person organizes their own environment.
  - **Confiança** — states, results and problems without ambiguity.
  - **Evolução** — the platform grows with new needs.
- **Module architecture:** modules that work together inside one shell
  (`ModuleNav`). Today: Início, Atendimento (inbox), Negócios (deals),
  Integrações, Configurações. The brand's reference set adds Tarefas,
  Documentos, Automações (flows), Indicadores and Assist (AI) — directional,
  not committed scope; `roadmap.md` stays the source of what lands when.
- **Permission-first integrations:** "Você decide quais informações esta
  integração pode acessar." — matches the observer-first, approve-before-apply
  stance above.
- **Audience** (aligned with "Who"): independent professionals, entrepreneurs
  and small teams sharing one environment with per-person permissions.
- **Voice:** calm, competent, objective; pt-BR, "você", sentence case;
  nautical words only in brand moments (onboarding, login, campaigns). Full
  rules in `DESIGN.md` → Content & Voice.

Commercial module names (BOSUN Home, Tasks, Docs, Flow, Connect, Insights,
Assist) belong to marketing; the app uses plain words. A public landing page
built from the brand's website reference is **not** in scope yet (decided
2026-10-08).
