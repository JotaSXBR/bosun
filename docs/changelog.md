# Changelog

Delivered work, newest first. Moved out of `TODO.md` so the backlog stays
a backlog — new entries land here when a `## Concluído` item ages off
TODO.md (audit AUD-024). `tasks/briefs/` and `tasks/*.done.md` remain the
local per-task archive.

- **P1 — UX: 7 leis em todas as telas** ✅ 2026-10-11 —
  `control-md` 42→44px (WCAG 2.5.5); componente `Steps` no DS (Passo X de Y
  - check + copy "Quase lá — falta N" na reta final); `<select>` nativos →
    DS `Select` (setup + nova conexão); `onboarding_checklist` tenant-owned
    (RLS + FORCE, jsonb por org, migração 0024) + `@crm/core/onboarding`
    (`getChecklist` com endowed `org_created`, `completeStep` idempotente);
    marks em org/integração/equipe/funil + `first_conversation` no ingest
    inbound; card "Primeiros passos" na home (sempre visível enquanto
    incompleto, CTA = próximo passo, some aos 100%); `/app/settings/ai` em 6
    subpaths com tabs Radix (deep links preservados, "Analisar agora"
    contextual em Sugestões); `ticket-actions` com primário por status +
    "Mais ações" (Adiar ▸/Transferir ▸ submenus); `connection-actions` com
    CTA contextual + danger no menu; toolbar do kanban e `/settings` com
    hierarquia. Gate do ciclo: typecheck 14/14, lint 0 erros, unit 167/167,
    integração 5/5 (RLS + idempotência + merge de marks concorrentes via
    `steps ||` jsonb), smoke browser real (sign-up → org →
    checklist 1/5 → 2/5 ao criar funil, 0 erros de console). Checklist das 6
    perguntas virou gate de `/review` em
    `docs/development/ux-7-leis-checklist.md`. Plan: `tasks/plan-ux-7-leis.done.md`.
- **Padrão de qualidade por pesquisa externa** ✅ 2026-10-10 —
  `docs/development/code-quality-standard.md` (§1 fontes, §2 adoção/contagens).
  `tooling/eslint/base.js` reescrito: `eslint-config-prettier`, sonarjs
  cognitive-complexity, família de complexidade/tamanho com defaults da doc,
  `stylisticTypeChecked` medido regra a regra, subset security low-FP,
  fronteiras `no-restricted-imports` consolidadas, `react/no-multi-comp`;
  `playwright.js` → `flat/recommended`; tsconfig +5 flags strict
  (`noImplicitReturns` deferido, 1 violação). Lint 0 erros; warns são os
  orçamentos medidos do §2.3.
- **Fix — globMatch do workflow hook** ✅ 2026-10-05 — `dir/**` só casava
  filhos diretos (replaces encadeados remontavam o `*` inserido por `.*`).
  `.devin/hooks/workflow.mjs` agora usa placeholders `\x01`/`\x02`; `**`
  cruza `/` como documentado e `**/*.md` volta a cobrir arquivos na raiz.
- **P1 — Ambiente Coolify provisionado + staging no ar** ✅ 2026-10-05 —
  2 projetos (`Bosun Staging`, `Bosun Production`) com recursos **nativos
  separados**: postgres pgvector (database resource + env `PGDATA` —
  fix do mount-path do PG18), redis (database), rustfs e waha:gows
  (applications com volumes + `custom_network_aliases`), app
  docker-image (domínio, health `/api/health`, envs). `migrate.mjs`
  provisiona a role `crm_app` sozinho. GHCR auth via `docker login` no
  Terminal do host (one-time). **Staging live**:
  `https://bosun-staging.example.com/api/health` (real URL in
  `docs/development/deployment.local.md`) →
  `{"status":"ok","db":"ok"}` + cert Let's Encrypt real. Root causes do
  ciclo de rollbacks: env vars duplicadas (removidas nos 2 apps) +
  `CHANNEL_CREDENTIALS_KEY` fora do formato hex64 (corrigida) +
  healthcheck host `localhost`→`127.0.0.1` + `start_period` 120s +
  `curl` na imagem. O "404 + TRAEFIK DEFAULT CERT" era sintoma de
  rollback contínuo, não falha de proxy. Healthchecks completos: WAHA
  `GET /ping:3000` (`WAHA_API_KEY_EXCLUDE_PATH=ping` libera o endpoint do
  auth), RustFS `GET /health/live:9000`; fqdn público acidental do
  rustfs-staging removido — **todos os 6 apps (3 por ambiente) em
  `running:healthy`**. Ver `docs/development/deployment-coolify.md`.
- **Decisão — background jobs** (2026-10-04, implementada slice 5):
  **pg-boss** escolhido sobre BullMQ e self-host Trigger.dev — enqueue
  transacional com a escrita no Postgres (sem outbox), zero infra nova.
  Trigger.dev removido por completo; ADR 0016 substitui ADR 0010.
  Ver `docs/development/jobs-pg-boss.md`.
- **P1 — Repo + CI/CD** ✅ 2026-10-05 — repo privado `JotaSXBR/bosun`;
  marca "Bosun" (pacote root, compose project, README); CI com job `scan`
  (Trivy fs: deps+secrets, HIGH/CRIT fixável); CD `cd.yml`: imagem → GHCR
  → Trivy image → deploy staging em push na `main` / prod em tag `v*.*.*`
  / rollback via dispatch (retag `:prod`); `Dockerfile` multi-stage
  (standalone + migrator isolado), entrypoint roda migrations antes do
  server; `/api/health` com DB ping. ADR 0015, `docs/development/cicd.md` +
  `deployment-coolify.md`. **e2e hardening** 2026-10-13: CI roda Playwright
  contra o build standalone (`node .next/standalone/apps/web/server.js`,
  com `static`+`public` copiados como no Dockerfile) — `pnpm dev` +
  Chromium + Postgres estourava o runner (4× SIGTERM); `logger.ts` passou
  a escrever via `console.*` (flood de warnings Edge no `instrumentation`
  compilava em loop); `server.js` força `NODE_ENV=production`, então
  `AUTH_REQUIRE_EMAIL_VERIFICATION`/`AUTH_RATE_LIMIT` viraram overrides
  explícitos de env (on em prod quando ausentes) e o step e2e desliga
  ambos — specs assinam sem verificar e-mail. Suite CI: 17/17 em ~30s.
- **P1 — Billing: idempotência do webhook ASAAS** ✅ 2026-10-03 —
  `billing_customers` (1:1 org ↔ customer ASAAS), `billing_subscriptions`,
  `billing_payments` e `billing_webhook_events` (dedup por `event_id`) com
  tenant + RLS forçada (migração 0004); webhook
  `POST /api/webhooks/billing/asaas` (header `asaas-access-token` =
  `ASAAS_WEBHOOK_TOKEN` → `withServiceAccess` → grava evento → resolve org
  via customer → upsert do pagamento); módulo `@crm/core` billing
  (`handleAsaasWebhook`, `listBillingPayments`, `getBillingSubscription`,
  `ensureBillingCustomer`); permissão `billing:read` (owner/admin).
- **P1 — Realtime: SSE inbox** ✅ 2026-10-03 — `pg_notify` no ingest
  (`emitDomainEvent`, canal `crm_domain_events`), `subscribeDomainEvents`
  com conexão dedicada por subscriber + filtro de tenant, SSE
  `GET /api/conversations/stream` (heartbeat 25s, auth por sessão),
  `InboxLive` no shell `/app` com refresh debounce; UI `/app/inbox`. Ver
  `docs/architecture/realtime.md`.
- **P1 — Integrations + Messaging** ✅ 2026-10-03 — `channel_connections`,
  `contacts`, `conversations`, `messages` com tenant + RLS forçada
  (migração 0003); credenciais AES-256-GCM (`CHANNEL_CREDENTIALS_KEY`);
  webhook `/api/webhooks/channels/[token]` (token → `withServiceAccess` →
  verify → parse → `withTenant` ingest idempotente → enqueue
  `process-channel-event`); módulos `@crm/core` integrations+messaging;
  UI `/app/integrations`.
- **P0 — Security: CSP com nonce** ✅ 2026-10-03 — `proxy.ts` gera nonce por
  request e emite CSP em toda resposta de documento (inclusive redirects);
  `force-dynamic` no root layout; política documentada em
  `docs/architecture/security.md`.
