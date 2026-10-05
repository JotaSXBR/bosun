# TODO

Prioridades: **P0** segurança/correção urgente · **P1** próximo trabalho
planejado · **P2** quando escalar · **P3** backlog de higiene.

## Produto — backlog (fonte: docs/product/, ADR 0014)

Ordem do produto definida pelo fundador: integrações ✅ → multi-atendimento
→ chat do site → IA (observer) → leads/funil → atividades → settings.

- **P1 — Multi-atendimento**: `teams`/`team_members` (setores) ✅;
  `conversations` ganha `sector_id`, `assignee_id` e ciclo de status
  `open|in_progress|waiting_customer|resolved` ✅ (`archived` removido);
  views Fila/Aguardando/Minhas/Resolvidas (fila = open + sem assignee,
  mais antiga primeiro); `messages.private` (notas internas) ✅ coluna;
  página de conversa + envio outbound via `provider.sendMessage`; reabrir
  conversa em inbound ✅ + `waiting_customer`→`in_progress` ✅; papel
  `viewer` (read-only) ✅; `organization_settings` ✅ (auto-reply fora de
  horário 1×/dia ainda pendente). **Slice 1 entregue** (schema + lifecycle +
  viewer + settings); faltam slice 2 (ações/outbound/notas/off-hours) e
  slice 3 (UI views/conversa/teams). Ver `docs/product/domain-model.md` +
  `rules.md`.
- **P1 — i18n**: `next-intl` com strings PT-BR centralizadas; extrair
  strings existentes.
- **P1 — Site chat**: provider `site_chat` + widget embarcável + endpoint
  público rate-limited (sessões anônimas).
- **P1 — IA observer (v1)**: `org_llm_credentials` (BYOK + prioridade/
  fallback; OpenAI/Anthropic/Gemini), `ai_usage_events`, `agents`,
  `agent_suggestions`, `knowledge_entries`, task observer no Trigger
  (resolve-hook + botão manual), inbox de sugestões com aprovar/rejeitar +
  notificação via SSE. Ver `docs/product/ai-agents.md`.
- **P1 — Leads/funil**: `funnels`, `funnel_stages`, `deals`, `labels`,
  atributos customizados, link conversa↔deal (decisão humana), UI kanban,
  templates de funil por nicho.
- **P2 — Atividades/tasks** em contatos/deals/conversas.
- **P2 — Settings**: branding (logo/tema, `custom_domain` reservado),
  business hours UI, plano/billing UI, `usage_counters` (storage, 500 MB
  free → por GB).
- **P2 — Canais seguintes**: Instagram/Facebook (Meta), e-mail (decidir
  provedor inbound), Telegram.
- **P2 — Google**: fluxo OAuth sobre `external_connections` (tabela entra
  com a fase de IA) + People/Contacts sync, Calendar, Gmail tools.
- **P3 — LGPD endpoints**: exportar/excluir dados do contato, retenção.

## Implementação futura (prioridade)

- **P2 — Rate limit em Redis** quando houver >1 instância do web. Benefício:
  limites corretos multi-instância. Custo: baixo.
- **P2 — Sentry sourcemaps/upload wiring**. Benefício: stacks legíveis em
  produção. Custo: baixo.
- **P2 — Branch protection na `main`**: exige GitHub Pro em repo privado
  (API retornou 403). Quando o plano subir: required checks
  `quality`/`integration`/`scan` + bloquear force-push. Ver
  `docs/development/cicd.md`.

- **P3 — Upgrade Coolify** ≥4.4: traz API de registries
  (`POST /servers/{uuid}/registries`) — docker login vira automável via
  API/MCP. Manutenção planejada, afeta outros projetos no servidor.

## Pesquisa / upgrades futuros

- **P1 — Node 26**: migrar após 2026-10-28 (vira LTS) + validação da toolchain.
- **P1 — TypeScript 7**: migrar quando typescript-eslint suportar (acompanhar
  typescript-eslint#10940; API só chega no TS 7.1). `tsgo` como typecheck
  sidecar é opção intermediária.
- **P3 — `erasableSyntaxOnly`**: revertido na adoção (7 propriedades de
  parâmetro de construtor em 7 arquivos > teto de 3). A expansão é mecânica;
  refazer o trial depois libera compat com type-stripping/tsgo. Ver
  docs/adr/0013.
- **P3 — Split lint tipado/não-tipado** se lint passar de ~30s (hoje ~25s
  uncached). Ver docs/adr/0013.
- **P3 — Dead-code sweep (knip), dependabot/renovate, git hooks** para
  contribuidores humanos.
- **P3 — Logger edge-safe**: `instrumentation.ts` puxa
  `@crm/observability` para o bundle Edge e o Turbopack avisa que
  `process.stdout/stderr` não existem lá (warning de build, não erro).
  Opções: isolar o registro de streams atrás de uma checagem de runtime ou
  variant `edge` do logger.
- **P3 — GitHub MCP instável**: `github-mcp-server` responde reads
  (`get_me` ok) mas falha conexão em writes (`create_pull_request` —
  PR #1 foi criada via `gh` com autorização pontual). Diagnosticar se é
  transporte/sessão do MCP local; regra de "GitHub só via MCP" segue.
- **P3 — Promover warns a error** — contagem **zerada** em
  `chore/lint-warnings` (PR separado): `prefer-nullish-coalescing`,
  `no-unnecessary-condition`, `complexity` e `max-statements` resolvidos
  via refactor (mapa de predicados em `isConfigured`, handlers por evento
  nos parsers de webhook, helpers extraídos em `seed`/`organization`).
  Falta só flipar warn→error no eslint-config quando o PR mergear —
  workflow em `docs/development/tooling.md`.

## Concluído

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
  `https://bosun-staging.fluxie.com.br/api/health` →
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
- **Decisão — background jobs** (2026-10-04): **pg-boss** escolhido sobre
  BullMQ e self-host Trigger.dev — enqueue transacional com a escrita no
  Postgres (sem outbox), zero infra nova. Trigger.dev sai; migração dos
  tasks do `@crm/automation` vira fase com ADR próprio (substitui ADR 0010).
  Enquanto isso enqueue permanece no-op (`isConfigured("trigger")`).
- **P1 — Repo + CI/CD** ✅ 2026-10-05 — repo privado `JotaSXBR/bosun`;
  marca "Bosun" (pacote root, compose project, README); CI com job `scan`
  (Trivy fs: deps+secrets, HIGH/CRIT fixável); CD `cd.yml`: imagem → GHCR
  → Trivy image → deploy staging em push na `main` / prod em tag `v*.*.*`
  / rollback via dispatch (retag `:prod`); `Dockerfile` multi-stage
  (standalone + migrator isolado), entrypoint roda migrations antes do
  server; `/api/health` com DB ping. ADR 0015, `docs/development/cicd.md` +
  `deployment-coolify.md`.
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
