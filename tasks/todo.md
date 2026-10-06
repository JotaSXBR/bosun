# Task Checklist — WAHA chat features (Brief 2)

> Ordem: T1+T2 → checkpoint → T3+T4 → checkpoint → T5→T6→T7 → T8.
> Status: [ ] pendente · [~] em progresso · [x] concluída

## Fase A — adapter + schema

- [x] **T1** channels: 4 eventos novos parseados + `sendSeen`/`sendPresence`/`subscribePresence`/`sendReaction`/`editMessage`/`deleteMessage`/`fetchMedia`/`replyToId`/`sendVoice` + fake + unit tests
- [x] **T2** db: migration `revoked_at`/`edited_at`/`message_edits`/`message_reactions` (RLS+grant+checklists) + repository helpers

## Fase B — core ingest + service

- [x] **T3** ingest: `message.reaction`/`edited`/`revoked`/`presence.update` handlers + `contact.presence` notify-only + `message.updated` events + int tests
- [x] **T4** outbound: `sendChannelMessage` (media+reply_to), `reactToMessage`, `editMessage` (15min), `deleteMessage`, `sendPresence`, `sendSeen` no `pickupConversation` + int tests

## Fase C — web

- [x] **T5** actions: voice/doc upload→send, reaction/edit/delete/presence/subscribe + `GET /api/media/[id]` proxy + `resolveMessageMedia` int tests + `media-upload` unit tests
- [x] **T6** UI mensagens: ticks, reações, editada+histórico, apagado por papel, `PresenceIndicator`, quote, media bubbles
- [x] **T7** composer: emoji grid, anexo, áudio recorder+preview, presence wiring

## Fase D — docs + gate

- [x] **T8** `waha-setup.md`/`TODO.md`/docs → gate `format:check`+`typecheck`+`lint`+unit+int

## Artefatos

- [x] Decisões novas refletidas em `waha-setup.md`/TODO
- [x] Checklist de validação real (aparelho) anotada p/ quando staging destravar — em `TODO.md` (payloads reais GOWS + presence AUTO_ONLINE)
