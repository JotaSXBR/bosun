# Implementation Plan: Site chat (canal widget)

## Overview

Canal `site_chat` first-party: visitante abre o widget embarcável →
pré-form (nome + telefone + email válidos) → mensagens entram na inbox
como conversa normal → agente responde → resposta chega ao widget via SSE
público → mesmo token de sessão retoma a conversa ativa. Valida a
abstração `ChannelProvider` sem API de terceiros.

## Architecture Decisions

- **Inbound reutiliza `ingestChannelWebhook`**: o POST público do widget
  é tratado como "webhook" first-party — `resolveWebhookConnection` pelo
  token → `provider.verifyWebhook` (checks de sessão) → `parseWebhook`
  normaliza o body em `message.received` → `ingestChannelEvent` dentro de
  `withTenant`. Mesmo pipeline do WAHA/Meta, sem atalhos.
- **`webhookToken` da connection = chave pública do embed** (já
  unguessable, já indexado). Vai no snippet `data-token`.
- **Sessão do visitante = `site_chat_sessions`** (nova tabela): token
  unguessable → connection + contact. RLS tenant; endpoint público
  resolve via token, não via org.
- **Contato deduplica por email**: `channelUserId` e `externalId` da
  conversa = email normalizado → mesmo email em outro device retoma o
  ticket. Limitação: sem verificação de posse do email (padrão de widget
  anônimo; identidade verificada fica pra fase autenticada — fora de
  escopo).
- **Outbound ao visitante**: `provider.sendMessage` é no-op success —
  a mensagem já persiste + `emitDomainEvent` no write path. O stream SSE
  público (`subscribeDomainEvents` filtrado por `conversationId`) emite
  ping → widget rebusca via `GET /api/widget/messages`. Funciona
  cross-process via pg LISTEN/NOTIFY.
- **Config do widget** (`welcomeText`, `accentColor`, `position`) em
  `channel_connections.metadata` — jsonb já existe, sem tabela nova.
- **Rate limit em memória** (Map por IP p/ session-create, por token p/
  message) — single instance conforme roadmap; Redis adiado.
- **CORS `*`** nos endpoints `/api/widget/*` (embed em domínio arbitrário).
- **`widget.js` vanilla** em `public/` — zero deps, embed via script tag;
  não carrega React pro site do cliente.
- **Sem mídia/anexos no v1** (texto; `sendFile` não generaliza ainda).
  Typing/read receipts avaliados no build se baratos — provável adiar.

## Task List

### Phase 1 — Foundation (schema + adapter + core)

- [ ] **T1 — Schema `site_chat_sessions` + kind `site_chat`**
      Tabela (id, organizationId, channelConnectionId→fk cascade,
      contactId→fk, token unique, createdAt, lastSeenAt) + RLS +
      `index(token)`; migration altera check `channel_connections_kind_check`
      p/ incluir `'site_chat'`; grants a `crm_app` via default privileges.
      Verify: `pnpm db:generate` + `db:migrate` local; int test RLS mínimo.
- [ ] **T2 — Adapter `site-chat`**
      `adapters/site-chat.ts`: `kind:"site_chat"`, capabilities
      `{qrCodeConnect:false, media:false}`, `connect()` → connected
      imediato, `verifyWebhook` valida presença de session token no body,
      `parseWebhook` → `message.received` (zod no payload), `sendMessage` →
      `{sent:true, externalId}` no-op (delivery via SSE). Kind em
      `ChannelProviderKind` + `case` no registry. Unit tests do normalize.
- [ ] **T3 — Core: sessão do visitante**
      Em `modules/messaging/sitechat.ts`: `createWidgetSession`
      (resolve connection por webhookToken → upsert contact por email →
      insert session), `resolveWidgetSession` (token → session+contact+
      connection, toca lastSeenAt), `listWidgetMessages` (histórico da
      conversa por after-cursor). Zod no pré-form (nome 2+, email, telefone
      E.164-flex). Int tests: sessão→contato→retomada, RLS, pré-form inválido.

### Checkpoint 1

- [ ] typecheck + lint verdes; int tests do módulo passam

### Phase 2 — Endpoints públicos

- [ ] **T4 — `POST /api/widget/session` + `POST /api/widget/message`**
      Session: body `{connectionToken, name, email, phone}` → zod → rate
      limit IP → `createWidgetSession` → `{sessionToken, welcomeText,
accentColor}` (de metadata). Message: `{sessionToken, text}` → rate
      limit token → resolve session → monta `RawWebhookRequest` →
      `ingestChannelWebhook`-equivalente. CORS + OPTIONS. Route int tests.
- [ ] **T5 — `GET /api/widget/messages` + `GET /api/widget/stream`**
      Messages: token → `listWidgetMessages` (after=cursor). Stream: token →
      `subscribeDomainEvents(org)` filtra `conversationId` → SSE ping
      (`retry:`/`heartbeat` iguais ao stream da inbox). Route int tests.

### Checkpoint 2

- [ ] curl-level: session → message aparece em `conversations`+`messages`;
      stream emite evento no outbound

### Phase 3 — Widget + config UI

- [ ] **T6 — `public/widget.js` + `/widget-demo`**
      Vanilla: bolha flutuante, janela, pré-form (ou direto se session no
      localStorage), lista msgs, POST message, EventSource → refetch,
      `data-token`/`data-api`/`data-position`/`data-color` attrs. Demo page
      embeda o script local.
- [ ] **T7 — Conexão site_chat em `/app/integrations`**
      Form de nova conexão vira kind-aware (site_chat = só nome; creds
      `{}` criptografadas vazias). Página da conexão: campos de config
      (welcome/cor/position → metadata) + snippet de instalação copiável +
      link pra demo.

### Checkpoint 3

- [ ] Fluxo manual completo no browser: demo → pré-form → msg na inbox →
      resposta do agente chega ao widget

### Phase 4 — E2E + docs

- [ ] **T8 — E2E + docs**
      `e2e/site-chat.spec.ts`: demo page → pré-form → msg → inbox mostra →
      responder → widget recebe (Playwright, server actions via UI do agente).
      TODO.md item → entregue + pendências; `domain-model.md` marca
      `site_chat` implemented.

## Risks and Mitigations

| Risk                                            | Impact | Mitigation                                                           |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------- |
| Session token vaza → impersona visitante        | Med    | Token 32B random; rate limit; docs da limitação (sem prova de posse) |
| LISTEN connection por visitante                 | Med    | Idêntico ao padrão inbox; revisit se fan-out alto (nota no TODO)     |
| Check constraint `kind` em migration aplicada   | Baixo  | Migration nova altera — nunca editar aplicada (regra do repo)        |
| Outbound não emite domain event p/ message.sent | Med    | Verificar no build; se faltar, emitir no write path de outbound      |
| Pré-form "telefone válido" ambíguo              | Baixo  | Zod: 8–15 dígitos após strip de não-dígitos; guarda DDI              |

## Open Questions

- Nome do canal na UI: "Site chat" ok ou "Chat do site"? (cosmético —
  default "Site chat")
- `sendSeen`/typing no widget — decidir no build se o adapter ganha os
  métodos opcionais ou adia.
