# TODO

Prioridades: **P0** segurança/correção urgente · **P1** próximo trabalho
planejado · **P2** quando escalar · **P3** backlog de higiene.

## Produto — backlog (fonte: docs/product/, ADR 0014)

Ordem do produto definida pelo fundador: integrações ✅ → multi-atendimento
→ chat do site → IA (observer) → leads/funil → atividades → settings.

- **P1 — Multi-atendimento**: `teams`/`team_members` (setores) ✅;
  `conversations` ganha `sector_id`, `assignee_id` e ciclo de status
  `open|in_progress|waiting_customer|resolved` ✅ (`archived` removido);
  papel `viewer` (read-only) ✅; `organization_settings` ✅ (auto-reply
  fora de horário 1×/dia ainda pendente). **Slice 2 entregue**: modelo de
  tickets — `resolved` terminal; inbound cria follow-up (`preceded_by_id`,
  sem herdar setor/assignee); `ticket_number` org + `ticket_seq` por
  contato; `resolved_at`/`first_response_at`; `messages.author_id`; views
  inbox/queue/mine/resolved ✅; ações pickup/transfer/resolve/waiting/
  in_progress ✅; `sendOutboundMessage` (provider fora da tx, gap
  send-ok/write-fail aceito v1) ✅; `addInternalNote` ✅; `resumeTicket` ✅;
  `reopenTicket` ✅ (qualquer agente; janela `ticket_reopen_window_hours`
  default 48h por org; bloqueado se follow-up ativo; `resolved_by_id` p/
  auditoria — status `closed` materializado espera camada de jobs);
  `messaging:write` (viewer negado) ✅; Server Actions
  `apps/web/src/server/actions/messaging.ts` ✅. **Slice 3 entregue**:
  inbox operável — abas Fila/Minhas/Todas/Resolvidas (`?view=`,
  server-filtered), página `/app/inbox/[id]` com timeline unificada
  (notas âmbar, eventos de sistema, divisor "Ticket anterior"),
  actions bar (Assumir/Transferir/Resolver/Aguardando/Reabrir) +
  composer Responder/Nota interna; viewer read-only; nomes via joins
  (`reads.ts`, `listOrgMembers`). **Slice 4 entregue**: `/app/settings` —
  formulário da org com `ticketReopenWindowHours` (1–168h; exposto em
  `updateOrgSettingsInput`/`upsertSettings`) + `offHoursMessage`/timezone/
  locale, edição só owner/admin — + `/app/settings/teams` (CRUD de equipes
  - membros via `listOrgMembers`, `TEAM_NAME_TAKEN`; `teams:manage`).
    **Slice 5 entregue — multi-atendimento fechado**: jobs em **pg-boss**
    in-process (ADR 0016 — Trigger.dev removido; schema `pgboss` por
    migration + grants a `crm_app`; `boss.start()` no `register()`;
    enqueue transacional no ingest via `fromDrizzle(tx)`); `closed`
    materializado pelo sweep `close-resolved-tickets` (`*/15 * * * *`,
    janela por org) com guards/views/UI atualizados (badge "Fechado" +
    botão "Novo atendimento" = follow-up de closed); auto-reply fora de
    horário 1×/conversa/dia org-local no job `process-channel-event` —
    `maybeSendOffHoursReply` com send de sistema (`authorId` null,
    `metadata.system="off_hours"`, `{proximo_atendimento}` interpolado,
    dedup via `messages_off_hours_day_idx`). Ver
    `docs/product/domain-model.md` + `rules.md`.
- **P1 — i18n**: `next-intl` com strings PT-BR centralizadas; extrair
  strings existentes.
- **P1 — Site chat**: provider `site_chat` + widget embarcável + endpoint
  público rate-limited (sessões anônimas).
- **P1 — IA observer (v1)**: `org_llm_credentials` (BYOK + prioridade/
  fallback; OpenAI/Anthropic/Gemini), `ai_usage_events`, `agents`,
  `agent_suggestions`, `knowledge_entries`, job observer no pg-boss
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

- **P2 — `reopenTicket` nunca casa o catch de unique violation**:
  `actions.ts` testa `pgError.code === "23505"` no erro direto, mas o
  drizzle entrega `DrizzleQueryError` com o pg error em `cause` — o guard
  de `ACTIVE_TICKET_EXISTS` (race com inbound) não dispara e o erro cru
  chega à action. Extrair o helper `isTeamNameConflict` (teams/service.ts)
  ou equivalente que verifica `err.code` **e** `err.cause.code`.

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
  PRs #1 e #2 foram criadas via `gh` fallback). Diagnosticar se é
  transporte/sessão do MCP local. Regra atual: MCP primeiro, `gh` CLI como
  fallback em operações de pull request após a primeira falha (AGENTS.md).
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
