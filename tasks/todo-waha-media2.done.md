# Todo — Smoke WAHA rodada 2 (ver tasks/plan.md)

- [x] **1. WAHA fetchMessageMedia** — `waha.ts` +
      `waha-actions.ts`: `GET /api/{session}/chats/{chatId}/messages/
{messageId}?downloadMedia=true`, extrai `media.url ?? mediaUrl`,
      baixa via o mesmo guard do `fetchMedia` (re-root `/api/files/*`,
      recusa resto). Tipado em `provider.ts` se o ChannelProvider expõe
      capability. _Verify_: testes em `waha-chat.test.ts` — happy path
      (200 → json com media.url localhost → fetch no host configurado),
      mensagem sem media → null/erro tratado.
- [x] **2. Resolver fallback** — `message-views.ts`: `getMessageMedia`
      inclui `externalId` da mensagem e `externalId` da conversa;
      `MediaResolverDeps.fetchMessageMedia?`; `resolveMessageMedia`:
      try fetchProviderMedia → falhou/null → try fetchMessageMedia →
      falhou → null. _Verify_: `message-views.int.test.ts` — media com
      url estrangeira + dep que resolve por id retorna bytes.
- [x] **3. Rota media** — `api/media/[id]/route.ts` passa
      `fetchMessageMedia` usando o provider quando disponível.
      _Verify_: typecheck web.
- [x] **4. Duração de áudio** — `AudioPlayer`: se `duration` não for
      finita no `loadedmetadata`, `currentTime = 1e7` até `timeupdate`
      revelar a duração real (volta a 0, sem tocar); prop opcional
      `durationHint` como fallback de exibição. `PreviewBar` usa
      `AudioPlayer src={previewUrl} durationHint={elapsed}`.
      _Verify_: typecheck + lint web.
- [x] **5. Gate + docs** — `pnpm verify` ✅ (204 unit), integração ✅
      (296), build ✅; `waha-setup.md` + `TODO.md` atualizados.
      Re-smoke staging **pende deploy**.
