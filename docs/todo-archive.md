# TODO — itens arquivados (entregues)

Movidos de `TODO.md` sem alteração de conteúdo para reduzir o custo de leitura.
Os itens aqui estavam marcados como entregues e sem pendência escrita.

- **Deploy — envs WAHA (Coolify)**: ✅ aplicado no staging (IGNORE_*,
  `WAHA_APPS_ON=brazilian-phone-numbers`, `WAHA_PRESENCE_AUTO_ONLINE=False`,
  `WHATSAPP_FILES_LIFETIME=604800` (7d em segundos — a env espera número),
  `WAHA_MEDIA_STORAGE=S3`, session restart envs, logs JSON).
  Resend ✅ (`EMAIL_PROVIDER=resend` + `EMAIL_FROM=Bosun APP
<noreply@send.fluxie.com.br>`) — verificação de email funciona.
  Restam do checklist: API key como hash sha512 (exige update conjunto no
  app) e S3/RustFS p/ mídia (hoje `media.url` aponta pro WAHA local;
  `WAHA_S3_PROXY_FILES=False` quebraria o `fetchMedia` — ver doc).

- **P1 — i18n**: ✅ entregue — `next-intl@4.14.9` com locale pt-BR fixo
  (sem `[locale]` na rota), catálogo `apps/web/messages/pt-BR.json`,
  `getTranslations`/`useTranslations` + `getFormatter`/`useFormatter` em
  todas as páginas/componentes de `apps/web/src`. **Pendências**: erros de
  `server/actions/*` e `packages/core` seguem PT-BR hardcoded (precisam de
  error codes → slice próprio); `widget.js` público sem i18n; segundo
  locale futuro = novo arquivo de mensagens + decisão de rota.

- **P1 — Site chat**: ✅ entregue — provider `site_chat` first-party
  (adapter em `packages/channels`, `sendMessage` no-op: entrega é SSE),
  `site_chat_sessions` (RLS, migration `0016`), `POST /api/widget/session`
  - `message` + `GET /api/widget/messages` + `stream` (SSE público filtrado
    por conversa, CORS, rate limit), inbound pelo mesmo `ingestChannelWebhook`
    (sem bypass do pipeline), contato deduplicado por e-mail (retoma thread
    entre devices), `widget.js` vanilla em `public/` (zero deps, sessão em
    localStorage), `/widget-demo`, integrações com snippet embarcável +
    config do widget (`metadata` jsonb: welcome/accent/position) e sem
    controles WAHA. **Pendências**: rate limit em memória (não compartilhado
    entre instâncias — Redis quando escalar); sem verificação de posse do
    e-mail do visitante (padrão de widget anônimo — qualquer e-mail válido
    retoma a thread); sem autenticação de visitante além do token; v1 texto
    apenas (sem mídia/anexos); sem i18n do widget; SSE fan-out revisitar se
    concorrência de visitantes ficar alta.

- **P1 — Leads/funil**: ✅ entregue — `funnels`, `funnel_stages`, `deals`,
  `labels` + joins em conversa/deal (RLS ×6, migration `0015`), permissão
  `leads:read/write/manage` (viewer só lê), `@crm/core/leads`
  (funnel/stage/deal/label + move + `createDealFromConversation` + board),
  templates de 4 nichos + funil demo no seed, actions + `/app/deals` kanban
  (dnd-kit + fallback por select de etapa), aside na conversa com "Virar
  lead" + deal card + etiquetas, `custom_attributes` jsonb, link único
  conversa→deal (unique parcial). **Pendências**: realtime do kanban
  adiado (v1 usa `revalidatePath`); e2e de criar deal depende de criação
  manual de contato (não existe UI — hoje contato só nasce via ingest);
  audit só em create/delete/link (moves são high-frequency).

- **P1 — Design system provisório**: ⛔ substituído pelo DS BOSUN
  (2026-10-08, item abaixo / ADR 0017). Histórico: dark-first (fundo
  preto, accent laranja, cantos retos `--radius:0`), Chakra Petch + IBM
  Plex Mono via `next/font`, `class="dark"` fixo no `<html>`, tokens em
  `packages/ui/src/styles/globals.css`; light fornecido era stub; sem
  theme toggle.

- **P2 — Contatos: criação manual + conversa outbound-first** ✅
  entregue (2026-10-09): módulo `@crm/core/contacts` (telefone
  internacional estrito `+<país>…` → `channelUserId` `@c.us`, e-mail em
  `metadata`, dedup por org), `/app/contacts` (lista + busca + criar),
  `NewConversationDialog` no inbox/contatos (WAHA conectada only, ticket
  nasce `in_progress`/me → 1ª mensagem pelo composer — Meta Cloud e
  site_chat fora), "novo contato" inline no ContactSelect do deal form.
  Permissões: `messaging:read` lista, `messaging:write` cria/abre.
  Importação (CSV/Google Contacts) = futuro.
- ~~**P1 — UX: 7 leis em todas as telas**~~ ✅ entregue 2026-10-11 — movido
  para `## Concluído`.

- **P2 — Perf: crescimento dos reads quentes** (auditoria
  `docs/audits/perf-baseline-2026-10-11.md`, planos medidos com dataset
  sintético + script reproduzível). ✅ Etapa 1 aplicada (2026-10-11):
  `listContacts` via LEFT JOIN + GROUP BY; índice
  `conversations(channel_connection_id, external_id, created_at desc)`
  (migration 0025); dedup por request via React `cache()`;
  `listMessages` retorna as últimas N em ordem cronológica;
  `/app/contacts` com paginação `?page=`. ✅ Etapa 2 (2026-10-12):
  `last_message_preview`/`last_message_direction` denormalizados em
  `conversations` (migration 0026 + backfill) — inbox lê colunas direto,
  **0 subplanos**; notas privadas deixam de poluir preview/awaitingReply.
  ✅ Etapa 3 (2026-10-12): scan de nudge (`listNudgeCandidates`/
  `listStaleNudges`) usa `last_message_*` — sem subplano por candidata;
  `listFunnelsWithStages` em batch (1+N → 2 queries); índice parcial
  `messages(conversation_id, created_at desc) where direction='inbound'`
  (migration 0027, `getLastInboundAt`). ✅ Etapa 4 (2026-10-12): F5
  refresh escopado por (página, evento) via `shouldRefreshForEvent`;
  F6 widget sem write por poll (throttle 5min); F15 mídia `immutable` +
  caixa `aspect-video` sem CLS. Deferidos documentados: F7 (tx por
  evento deliberado), F9 (board), F13 (ILIKE); futuro: invalidação
  direcionada via payload SSE, mux de LISTEN (comentário em realtime.ts).
