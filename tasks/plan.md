# Implementation Plan: WAHA go-live (Brief 1)

## Overview

Tornar a conexão WAHA operacional de ponta a ponta: sessão com nome
escolhido, `config.webhooks` registrado (7 eventos + HMAC + retries
exponencial), UI de pareamento (QR auto-refresh + código), reconectar sem
QR, reconciliador pg-boss para mensagens perdidas e card de saúde
(versão/reachoutTimelock/capping). Spec: `docs/development/waha-setup.md`.

## Architecture Decisions

- **Session name**: `credentials.session` (já no schema) — usuário escolhe,
  validado `[a-zA-Z0-9_-]+`, fallback `conn_<uuid>` gerado na criação.
  `external_ref` passa a guardar o **número pareado** (de `/me`), não o
  session name.
- **webhookUrl no adapter**: `WahaConfig` ganha `webhookUrl` +
  `webhookEvents`; o service monta `APP_URL + /api/webhooks/channels/<token>`
  — adapter não conhece APP_URL. `PUT /api/sessions/{s}` é **full-replace**:
  sempre enviamos o config completo (`{name, config:{webhooks:[...]}}`).
- **7 eventos já**: `message`, `message.ack`, `message.reaction`,
  `message.edited`, `message.revoked`, `session.status`, `presence.update` —
  parseWebhook ignora os ainda não mapeados; evita re-PUT no brief 2.
- **Provider iface** ganha métodos opcionais (só WAHA implementa):
  `requestPairingCode(phone)`, `getSessionInfo()` (status, phone via /me,
  flags), `getServerInfo()` (version/engine), `listChats()/listMessages()`
  (reconciler), `logout()`. Meta adapter intocado.
- **Reconciler ≠ ingest**: backfill insere via ingest com flag
  `skipJobs` — **não** enfileira `process-channel-event` (auto-reply para
  msg antiga seria bug). Dedup grátis pelo unique `externalId`.
- **Connect/reconnect**: `connect()` já cobre start de STOPPED/FAILED;
  UI expõe "Reconectar" chamando o mesmo fluxo + enqueue do reconciler;
  `logout()` separado para desparear.
- **QR no client**: action `getPairingQr` chama `connect()` e devolve
  `{status, qrCode}` — modal faz poll ~15s enquanto `SCAN_QR_CODE`.

## Task List

### Fase A — Adapter WAHA (canal)

- [ ] **T1**: `waha.ts` — session lifecycle completo: create com
      `config.webhooks` (7 eventos, hmac, retries exp 5s×8), `PUT` update
      idempotente, `logout`, `restart`; `requestPairingCode`; `getSessionInfo`
      (`/me` + status + timelock/capping); `getServerInfo`
      (`/api/server/version`); `listChats`/`listMessages` (paginado);
      schemas zod novos. Unit tests fixture-based.
- [ ] **T2**: `provider.ts`/`domain.ts` — tipos novos
      (`SessionInfo`, `ServerInfo`, `ExternalChat`, `PairingResult`) e
      métodos opcionais na interface; `registry.ts` repassa `webhookUrl`;
      `testing.ts` fake atualizado.

### Fase B — Service + actions

- [ ] **T3**: `integrations/service.ts` — `connect()` propagando
      `qrCode`/`sessionStatus`; `requestPairingCodeAction` service;
      `reconnectConnection` (connect + enqueue reconcile); `getHealth`
      (sessionInfo + serverInfo → `connection.metadata`);
      `providerFromCredentials` recebe `webhookUrl` (muda assinatura — ajustar
      `resolveWebhookConnection`/`providerForConnection`/outbound callers);
      form ganha campo session.
- [ ] **T4**: actions + UI `/app/integrations` — modal de pareamento
      (abas QR/código, poll), campo "Nome da sessão", botões
      Conectar/Reconectar/Parar/Desparear/Excluir, card saúde (versão,
      número, badges).

### Checkpoint A+B

- [ ] typecheck/lint verdes; unit channels+core verdes

### Fase C — Reconciler

- [ ] **T5**: `automation` — fila `channel-messages-reconcile`
      (payload `{connectionId}`), handler service-scope →
      listChats→listMessages→ingest `skipJobs`; enqueue no `reconnect` e
      após `connect` bem-sucedido; schedule periódico (*/30min) no `startJobs`.
      Int test idempotência (2× run = 0 duplicatas, 0 jobs de evento).

### Fase D — Docs + gate

- [ ] **T6**: `waha-setup.md` → seção "implementado" + checklist de envs
      Coolify (usuário aplica); `TODO.md` backlog; gate final completo.

## Risks and Mitigations

| Risk                                          | Impact | Mitigation                                                                |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `PUT` session full-replace apaga config       | Med    | Sempre enviar config completo; int test cobre idempotência do re-register |
| QR expira (60s→20s×6→FAILED)                  | Med    | Modal re-busca a cada ~15s; botão re-tentar ao FAILED                     |
| Backfill dispara auto-reply/job em msg antiga | Alto   | `skipJobs` flag no ingest — teste prova 0 enqueue                         |
| WAHA real diverge do doc (GOWS)               | Med    | Smoke manual em staging após deploy; endpoints cobertos por unit fixtures |
| `session` duplicado entre conexões            | Baixo  | Erro WAHA 4xx → mapear pra mensagem amigável "nome já em uso"             |

## Checklist de deploy (Coolify — usuário aplica, não é código)

WAHA container: `WAHA_PRESENCE_AUTO_ONLINE=False`,
`WAHA_SESSION_CONFIG_IGNORE_GROUPS=True`, `WHATSAPP_RESTART_ALL_SESSIONS=True`,
`WAHA_MEDIA_STORAGE=S3`(+S3 vars→RustFS), `WAHA_NAMESPACE=all`,
`WAHA_APPS_ENABLED=True`, `WAHA_APPS_ON=brazilian-phone-numbers`,
`WAHA_API_KEY_PLAIN`, `WHATSAPP_SWAGGER_ENABLED=false` (prod).
Bosun app: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`.

## Open Questions

- Nenhuma de produto — validações de campo (notificações do celular com
  AUTO_ONLINE=False; history-sync no reconnect) viram itens de teste no
  smoke de staging.
