# Todo — Inbox UI superfície (plano 2) — CONCLUÍDO

- [x] **1. Cursor + badge** — markConversationReadAction + mark-on-open
      no mount do pane (client effect, não prefetch) + badge unreadCount + preview bold · verify: visual + int test cursor existente ✅
- [x] **2. Avatar na row** — `contacts.avatarUrl` projetado na list
      query + img/fallback iniciais · verify: row renderiza foto ✅
- [x] **3. Aguardando há Xh** — elapsed desde lastMessageAt quando
      awaitingReply · verify: row mostra "aguardando há …" ✅
- [x] **4. Ícone de mídia** — mediaKind da última msg no preview
      (ícones mic/image/video/file no DS) · verify: preview correto por tipo ✅
- [x] **5. Reenviar failed** — resendFailedMessage (reusa content, novo
      sendMessage, atualiza externalId/status, claim atômico WHERE
      status='failed') + action + botão · verify: int test resend 9/9 ✅
- [x] **6. Player velocidade** — 1×/1.5×/2× + duração · verify: áudio
      toca nas 3 velocidades ✅
- [x] **7. Transcript** — metadata.transcript sob o player · verify:
      áudio transcrito mostra texto ✅
- [x] **8. sendSeen consumer** — users.sendSeen + status pending/open
      gateando sendSeen humano · verify: outbound.int.test.ts 10/10 ✅
- [x] **9. Atalhos de ação** — keymap a/r/s + hint · verify: atalhos
      disparam ações ✅
- [x] **10. Remover TeachAiDialog** — botão+componente+i18n fora ·
      verify: zero referências (proposeMemoryEntry preservado p/ observer) ✅
- [x] **11. Histórico do contato** — listContactTickets no aside ·
      verify: tickets anteriores listados ✅
- [x] **12. Toggle aside** — xl+ colapsa inline; <xl drawer+scrim ·
      verify: resize alterna modo ✅
- [x] **13. Valor editável deal** — inline edit via updateDeal ·
      verify: salva e persiste ✅
- [x] **14. i18n + polish + gate** — pt-BR completo, tokens DS,
      `pnpm verify` + verify:full ✅

Gate: `pnpm verify` ✅ + `pnpm verify:full` ✅ (278 int, 17 e2e, build).

`/review` aprovado 2026-10-13 — 1 required corrigido (`parseValueCents`
inflava 100x com ponto-decimal: "1234.56"→R$123.456,00; reescrito por
grupos de milhar sem regex unsafe). FYIs resolvidos após o review:
`listContactTickets` agora usa `ne()`; sendSeen = sinal de leitura puro
(sai do send/resend, entra em markConversationRead + refire do marker em
inbound novo com thread aberta); sticker (image/webp) renderiza sem
chrome + "Figurinha" na row; media sem source vira nota interna via
`metadata.unsupportedMedia`.
