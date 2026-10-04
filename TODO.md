# TODO

Prioridades: **P0** segurança/correção urgente · **P1** próximo trabalho
planejado · **P2** quando escalar · **P3** backlog de higiene.

## Produto — backlog (fonte: docs/product/, ADR 0014)

Ordem do produto definida pelo fundador: integrações ✅ → multi-atendimento
→ chat do site → IA (observer) → leads/funil → atividades → settings.

- **P1 — Multi-atendimento**: `teams`/`team_members` (setores);
  `conversations` ganha `sector_id`, `assignee_id` e ciclo de status
  `open|in_progress|waiting_customer|resolved`; views Fila/Aguardando/
  Minhas/Resolvidas (fila = open + sem assignee, mais antiga primeiro);
  `messages.private` (notas internas); página de conversa + envio outbound
  via `provider.sendMessage`; reabrir conversa em inbound; papel `viewer`
  (read-only); `organization_settings` (business_hours + mensagem fora de
  horário 1×/dia). Ver `docs/product/domain-model.md` + `rules.md`.
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
- **P3 — Promover warns a error** quando a contagem zerar:
  `prefer-nullish-coalescing` (1), `no-unnecessary-condition` (4),
  `complexity` (4), `max-statements` (3) — workflow em
  `docs/development/tooling.md`.

## Concluído

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
