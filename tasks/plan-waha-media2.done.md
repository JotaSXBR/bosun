# Plan — Smoke rodada 2: mídia via downloadMedia do WAHA + duração de áudio

- **Origem**: re-smoke 2026-10-14 (pós-deploy do PR #40) · `TODO.md` → WAHA
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-14

## Objetivo

Figurinha/mídia inbound que não vive em `/api/files/*` resolve baixando
via API do WAHA; áudio gravado mostra duração real no preview e no bubble.

## Contexto

Dois bugs do re-smoke:

1. **Sticker ainda quebrado após o re-root** — log do WAHA mostra
   `stickerMessage.URL = https://mmg.whatsapp.net/v/….enc?…`: para
   sticker o GOWS emite a URL do **CDN do WhatsApp** (blob criptografado,
   `.enc`), não um path local. Nem host interno nem `/api/files/` →
   `fetchMedia` recusa (correto recusar: baixar o `.enc` seria
   ciphertext inútil, e mandar `X-Api-Key` pra fora é proibido).
   **Decisão**: fallback de resolução — quando o fetch por URL falha, o
   resolver tenta `GET /api/{session}/chats/{chatId}/messages/
{messageId}?downloadMedia=true` (endpoint que WAHA usa pra baixar
   mídia sob demanda; a resposta traz `media.url` local `/api/files/*`).
   `chatId` = `conversations.external_id`; `messageId` =
   `messages.external_id` (serializado `false_{chat}_{stanza}`).
   Falha do provider passa a virar 404 no proxy em vez de 500.
2. **Áudio gravado fica "zerado" no preview** — blob do MediaRecorder
   (webm) não carrega metadado de duração → `<audio>` mostra 0:00 (e o
   `AudioPlayer` do bubble enviado mostra idem, pois `/api/media` serve o
   mesmo blob). **Decisão**: `AudioPlayer` faz o self-heal clássico
   (`duration === Infinity` → `currentTime = 1e7` no `loadedmetadata`,
   lê a duração real no `timeupdate`, volta pra 0) + prop `durationHint`
   com o `elapsed` medido na gravação; `PreviewBar` passa a usar o
   `AudioPlayer` (mesmo chrome do bubble enviado) com o hint.

## Escopo

packages/channels/src/adapters/waha.ts
packages/channels/src/adapters/waha-actions.ts
packages/channels/src/adapters/waha-chat.test.ts
packages/channels/src/provider.ts
packages/core/src/modules/messaging/message-views.ts
packages/core/src/modules/messaging/message-views.int.test.ts
apps/web/src/app/api/media/[id]/route.ts
apps/web/src/components/audio-player.tsx
apps/web/src/components/voice-recorder.tsx
apps/web/messages/pt-BR.json

## Fora de escopo

- Mover mídia inbound pro S3 (expira em 7d) — plano próprio.
- STT de áudio inbound, avatarUrl — itens já mapeados.
- Linha "Evento do sistema" sem texto.

## Tarefas

1. WAHA: `fetchMessageMedia(chatId, messageId)` — GET mensagem com
   `downloadMedia=true`, extrai `media.url ?? mediaUrl`, faz o fetch
   (reaproveita a checagem/re-root de `fetchMedia`). Testes mockFetch.
2. Core: `getMessageMedia` retorna também `externalId` +
   `conversationExternalId` (join conversations); `MediaResolverDeps`
   ganha `fetchMessageMedia?`; `resolveMessageMedia` tenta o URL fetch e,
   em falha, cai no fallback por id; erro de provider → null (404).
3. Rota `/api/media/[id]` wireia o dep novo via `provider.fetchMessageMedia`.
4. UI: `AudioPlayer` self-heal de duração + `durationHint?`;
   `VoiceRecorder.PreviewBar` troca `<audio controls>` pelo
   `AudioPlayer` com `durationHint={elapsed}`.
5. Gate + docs + re-smoke.

## Critérios de pronto

- [ ] `pnpm verify` verde
- [ ] Testes alvo: `waha-chat.test.ts` (novo método), `message-views.int.test.ts` (fallback)
- [ ] Docs: `waha-setup.md`, `TODO.md`
- [ ] Re-smoke staging: figurinha renderiza, áudio mostra duração e toca
