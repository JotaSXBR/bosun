# Todo — WAHA go-live (Brief 1)

## Fase A — Adapter WAHA

- [x] **T1** `waha.ts`: session lifecycle — create com `config.webhooks`
      (7 eventos + hmac + retries exp 5s×8), `PUT` idempotente, `logout`,
      `restart`, `requestPairingCode`, `getSessionInfo`, `getServerInfo`,
      `listChats`/`listMessages` + unit tests (9 lifecycle + 14 existentes)
- [x] **T2** `provider.ts`/`domain.ts`/`registry.ts`/`testing.ts`: tipos +
      métodos opcionais (`requestPairingCode`, `getSessionInfo`,
      `getServerInfo`, `listChats`, `listMessages`, `logout`), `webhookUrl`
      na config, fake provider

## Fase B — Service + UI

- [x] **T3** `integrations/service.ts`: connect propagando QR/status;
      pairing code; lifecycle stop/restart/logout; health via
      `getConnectionHealth` (live, sem metadata persistida); `webhookUrl`
      na factory (`APP_URL` + token); session no schema com fallback
      `conn_<hex>`; `resolveConnectionProvider` + `listConnectionsForReconcile`
- [x] **T4** UI `/app/integrations` + actions: `PairingPanel` (QR poll 15s +
      código por telefone), campo session validado, botões
      Conectar/Reconectar/Parar/Desparear/Reiniciar/Excluir, `ConnectionHealth`
      (número, pushName, versão WAHA, warnings anti-ban); reconcile enfileirado
      ao conectar

## Checkpoint A+B

- [x] `pnpm typecheck` + `pnpm lint` verdes; unit channels+core verdes

## Fase C — Reconciler

- [x] **T5** `automation`: fila `channel-messages-reconcile`, handler
      service-scope com ingest sem fan-out (sem `process-channel-event` →
      sem auto-reply off-hours em backfill), enqueue no connect, schedule
      */30min + int test (idempotente, RLS ok, payload adulterado rejeitado)

## Fase D — Docs + gate

- [x] **T6** docs: `waha-setup.md` marcado implementado + checklist Coolify
      no `TODO.md`; `jobs-pg-boss.md` com a nova fila; gate final verde
      (format/typecheck/lint/unit/int)
