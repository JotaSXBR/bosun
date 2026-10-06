# Implementation Plan — WAHA chat features (Brief 2)

## Overview

Levar o inbox do Bosun ao padrão WhatsApp sobre WAHA GOWS: ticks ✓✓
cinza/azul, reações, edição com histórico (`message_edits`), apagado híbrido
por papel (`revoked_at` + "ver original" p/ admin/manager), presence
typing/recording nos dois sentidos, áudio com preview, documentos, emoji e
resposta citada. Spec/decisões: `docs/development/waha-setup.md`.

## Architecture Decisions

- **Reações/edits/revokes persistem**: `message_reactions` (reactor_key =
  userId | channelUserId | 'me', 1 reação por ator por msg — replace),
  `message_edits` (histórico append-only de `previous_content`),
  `messages.revoked_at`/`edited_at` (badge barato, sem join).
- **Edição otimista com reconciliação**: o service aplica content+histórico
  na hora; o webhook `message.edited` só grava histórico quando o conteúdo
  **difere** do atual — dedup natural para o eco da nossa própria edição
  e para replays.
- **Presence do contato é transitória**: `presence.update` → parse →
  `emitDomainEvent({type:"contact.presence", conversationId, presence})`
  dentro da tx de ingest (pg_notify entrega no commit mesmo sem writes).
  SSE já carrega o evento; cliente mostra "digitando…/gravando…" ~10s sem
  `router.refresh`.
- **Presence do agente**: server action `sendPresenceAction` (throttle 4s
  no client, `paused` após ~8–10s idle). `sendSeen` dispara dentro de
  `pickupConversation` (nunca no open — decisão fechada).
- **Mídia outbound**: upload via action (FormData) → `tenantObjectKey` →
  RustFS → `getSignedUrl(get)` → WAHA baixa a URL assinada. Voice usa
  `/api/sendVoice` (PTT), docs/imagem/vídeo `sendFile`/`sendImage`/`sendVideo`;
  distinção via `mediaKind` + flag `voiceNote`.
- **Mídia inbound**: `content.source.url` aponta pro host interno do WAHA —
  browser não alcança → rota autenticada `GET /api/media/[messageId]` faz
  proxy via `provider.fetchMedia(url)` (X-Api-Key) e streama os bytes.
- **reply_to**: `OutboundMessage.replyToId?` → adapter inclui `reply_to`
  no body; inbound guarda `quotedId` no content jsonb (quote bubble).

## Task List

### Fase A — Adapter + Schema

- [ ] **T1** channels: parse dos 4 eventos (`message.reaction`/`edited`/
      `revoked`/`presence.update`) → novos `ChannelEvent`; métodos
      `sendSeen`, `sendPresence`, `subscribePresence`, `sendReaction`,
      `editMessage`, `deleteMessage`, `fetchMedia`; `replyToId` no
      OutboundMessage + `reply_to`; `sendVoice` quando `voiceNote`;
      fake provider + unit tests.
- [ ] **T2** db: migration — `messages.revoked_at`, `messages.edited_at`,
      `message_edits`, `message_reactions` (org_id + pgPolicy + RLS +
      grant + checklists); repository helpers: `updateMessageContent` +
      `insertMessageEdit`, `upsertReaction`/`deleteReaction`,
      `markMessageRevoked`, `listReactionsForMessages`, `countEditsForMessages`.

### Checkpoint A

- [ ] typecheck+lint verdes; unit channels; `db:migrate` limpo; int de
      isolamento RLS das 2 tabelas novas.

### Fase B — Core ingest + service

- [ ] **T3** messaging/service ingest: `message.reaction` (resolve msg por
      externalId → upsert/delete reaction + `message.updated` event),
      `message.edited` (update content + histórico quando difere),
      `message.revoked` (`revoked_at`), `presence.update` (resolve ticket
      ativo por externalId → `contact.presence` notify-only). Int tests.
- [ ] **T4** messaging outbound: `sendChannelMessage` (texto+mídia via URL
      assinada; reply_to), `reactToMessage`, `editMessage` (janela 15min),
      `deleteMessage`, `sendPresence`, e `sendSeen` dentro de
      `pickupConversation` (pós-tx, falha não derruba o pickup). Int tests.

### Checkpoint B

- [ ] unit+int verdes; webhook end-to-end stub cobre reaction/edit/revoke.

### Fase C — Web

- [ ] **T5** actions + rotas: `sendVoiceMessage`/`sendDocumentMessage`
      (FormData→storage→send), `reactToMessage`, `editMessage`,
      `deleteMessage`, `sendPresence`, `subscribePresence` (on open),
      `GET /api/media/[messageId]` proxy autenticado.
- [ ] **T6** UI mensagens: ticks (✓/✓✓ cinza→azul), chips de reação +
      picker, badge "editada" + popover de histórico, placeholder apagado
      (+ "ver original" admin/manager), `PresenceIndicator` (SSE filtrado,
      sem refresh), quote bubble + "responder", media bubbles (audio
      player/image/doc link via proxy).
- [ ] **T7** composer: grid de emoji, anexo doc, `MediaRecorder` com
      preview (ouvir/regravar/descartar)→send voice, wiring de presence
      typing/paused/recording.

### Fase D — Docs + gate

- [ ] **T8** `waha-setup.md` implementado, `TODO.md` → concluído,
      `jobs-pg-boss.md` se mexer em fila; gate final completo + int tests.

## Risks and Mitigations

| Risk                                                                                               | Impact | Mitigation                                                                                                                         |
| -------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Shapes reais de `message.edited`/`message.reaction`/`presence.update` no GOWS divergem do esperado | Med    | zod looseObject + safeParse → evento desconhecido cai em `[]` sem 500; validar com payload real no staging quando Resend destravar |
| `sendSeen`/presence falham mas pickup/send ok                                                      | Baixa  | provider call fora da tx, try/catch log-only                                                                                       |
| Media inbound expira (WAHA 180s/7d)                                                                | Med    | proxy busca sob demanda; documentar que blob fora do TTL retorna 404 no player                                                     |
| Dois EventSource por página (InboxLive + PresenceIndicator)                                        | Baixa  | PresenceIndicator pode consumir o mesmo stream; se duplicar, LISTEN extra é barato — revisitar só se doer                          |

## Open Questions

- `presence.subscribe`: assinar chat quando a página da conversa abre
  (ação on-mount) — se WAHA cobrar por subscribe, revisitar.
