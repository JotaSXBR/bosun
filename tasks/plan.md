# Plan — Inbox UI superfície (plano 2)

- **Origem**: `TODO.md` → inbox atendimento · `docs/product/inbox-ui-review.md` (itens aprovados em entrevista 2026-10-13) + primitivos do plano 1 WAHA (`conversation_reads`, `avatarUrl`, `metadata.transcript`, `sendSeen`)
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-13

## Objetivo

Transformar o workbench de atendimento numa superfície de omnichannel
funcional: não-lido por agente, identidade visual do contato, ações de
thread reais (reenviar, player rico, transcript), aside colapsável com
histórico — sem features de backend pesado (plano 3).

## Contexto

Decisões do gate + entrevista anterior:

- Conjunto aprovado: A1–A4, B4–B9, C2–C4, D3 + mark-on-open (vindo do
  plano 1). Plano 3 fica com B1 busca, B2 menu contexto, B3
  macros+aprovação, C1 ficha completa.
- **sendSeen (blue ticks)**: regra do usuário — pending + agente vai
  responder → sendSeen; open/assumida → só quando o humano interage na
  conversa. Cursor interno (`markConversationRead`) marca **ao abrir o
  pane** (padrão Chatwoot/WhatsApp; disparo via client effect no mount,
  nunca em render/prefetch de `<Link>`).
- `sendSeen` outbound hoje dispara em todo send humano com última msg
  inbound — passa a respeitar a preferência por usuário
  (`users.sendSeen`, já existente) + o status do ticket.
- `TeachAiDialog` sai do thread **inteiro** (aprendizado é do observer;
  `proposeMemoryEntry` permanece nos bastidores).
- Aside: aberto por padrão em `xl+`, botão colapsa; `<xl` vira
  drawer/overlay (Chatwoot). Mobile = drawer via mesmo botão.
- Resend de `failed` reusa o `content` persistido — novo
  `provider.sendMessage`, atualiza `externalId`/status; não duplica
  mensagem.
- Avatar na row: `contacts.avatarUrl` já populado pelo job do plano 1;
  lista já faz join com contacts — basta projetar a coluna.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

apps/web/src/app/app/inbox/**
apps/web/src/components/**
apps/web/src/server/actions/**
apps/web/src/server/services.ts
apps/web/messages/**
packages/core/src/modules/messaging/**
packages/core/src/modules/contacts/**
packages/core/src/modules/users/**
design-system/src/lib/icon-paths.ts

## Fora de escopo

- B1 busca no thread, B2 menu de contexto nativo, B3 macros `/` +
  fluxo de aprovação — plano 3 (backend pesado).
- C1 ficha de contato completa (edição de campos, Google-People-style)
  — plano 3.
- Qualquer mudança em `packages/channels`, `packages/db/src/schema`,
  `packages/automation`, `packages/ai` — o ícone de mídia do A4 usa a
  subquery de `mediaKind` em `listConversations` (sem coluna nova);
  `design-system/src/lib/icon-paths.ts` entra só para os ícones
  `mic`/`image`/`video`.
- SLA, CSAT, broadcast, round-robin, fila por prioridade.
- TTS/ElevenLabs; IA além do que já renderiza (drafts/nudges).

## Tarefas

1. **Cursor + badge (A1 + mark-on-open)** — action
   `markConversationReadAction`; componente client no pane que dispara
   no mount (não em prefetch); `ConversationListRow` já traz
   `unreadCount` → badge + preview em bold na row.
2. **Avatar na row (A2)** — projetar `contacts.avatarUrl` na list query;
   `<img>` na row com fallback de iniciais.
3. **Aguardando há Xh (A3)** — row mostra tempo decorrido desde
   `lastMessageAt` quando `awaitingReply` (inbound por último).
4. **Ícone de mídia (A4)** — extender preview da row com `mediaKind` da
   última mensagem → "🎤 áudio" / "📎 doc" em vez de texto cru.
5. **Reenviar failed (B4)** — `resendFailedMessage` no service (nova
   chamada `provider.sendMessage` com o `content` persistido, atualiza
   `externalId`/status) + action + botão no `message-item` quando
   `status=failed` + int test.
6. **Player de áudio (B5)** — playbackRate 1×/1.5×/2× + duração no
   componente de mídia.
7. **Transcript sob player (B6)** — render `metadata.transcript` quando
   presente (colapsável se longo).
8. **sendSeen consumer (B7)** — `sendChannelMessage` respeita
   `users.sendSeen` + status pending/open (regra do usuário); pickup já
   envia — conferir consistência.
9. **Atalhos de ação (B8)** — atalhos de teclado nos botões de ação do
   ticket (assumir/resolver/adiar), com hint visual; escopo só keymap +
   affordance.
10. **Remover TeachAiDialog (B9)** — tirar botão + componente +
    referências de i18n.
11. **Histórico do contato (C2)** — query `listContactTickets` (tickets
    do `contactId`, exclui a atual, status+data) + seção no aside.
12. **Toggle do aside (C3 + D3)** — estado aberto/colapsado; `xl+`
    inline colapsável, `<xl` drawer overlay com scrim.
13. **Valor editável do deal (C4)** — edição inline de `value` no
    deal-card usando `updateDeal` existente.
14. **i18n + polish** — chaves pt-BR de tudo; tokens do design system
    (sem cor hardcoded); `pnpm verify` final.

## Critérios de pronto

- [ ] `pnpm verify` verde (UI-only → verify; core messaging tocado em
      resend/sendSeen → cobrir com testes existentes + novos)
- [ ] Testes alvo: `outbound.int.test.ts` (sendSeen gate), novo int
      test do resend; componentes exercitados via e2e inbox existente
- [ ] Docs atualizadas: `docs/product/inbox-ui-review.md` (marcar
      entregue), `TODO.md`
- [ ] `TODO.md` movido para Concluído
