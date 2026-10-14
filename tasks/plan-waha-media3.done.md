# Plan — Smoke rodada 3: mídia por filename, play do áudio, horário local

- **Origem**: re-smoke 2026-10-14 (pós-deploy do PR #41) · `TODO.md` → WAHA
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-14

## Objetivo

Figurinha/mídia inbound resolve mesmo quando `downloadMedia` não devolve
`media.url` (usa `media.filename` → `/api/files/{filename}`); resolver
registra por que cada etapa falhou; preview de áudio volta a tocar;
horários do inbox saem de UTC e passam a usar o fuso do navegador.

## Contexto

Evidências do smoke pós-PR #41 (logs Coolify do WAHA staging):

1. **Figurinha segue quebrada** — WAHA baixou e salvou a mídia
   ("MediaManager: saved", "Converting Lottie sticker to WebP") e o
   nosso fallback por id bateu `GET …/messages/{id}?downloadMedia=true`
   com **200**… mas **nenhum `GET /api/files/*` aparece depois** → a
   resposta veio sem `media.url` aproveitável (nulo ou `.enc` de novo —
   o resolver engole o erro, 404 silencioso). Pela doc do WAHA, quando
   `url` vem nulo a resposta ainda traz `media.filename` (+`media.error`
   com `code/details`), e o arquivo salvo é servível em
   `/api/files/{filename}`. **Decisão**: parsear `filename`/`error`;
   se `url` falhar mas `filename` existir → montar `/api/files/{filename}`
   no baseUrl; se nem isso → erro distinguível. E instrumentar:
   `logger.warn` por estágio no `resolveMessageMedia` (mensagem do erro,
   nunca a URL — parâmetros assinados do CDN).
2. **Preview do áudio não toca** — a sonda de duração muta e faz
   `currentTime = 1e7` no _próprio_ `<audio>`; se `timeupdate` não dispara
   (webm do MediaRecorder sem cues), o elemento fica preso em seeking +
   muted e `play()` nunca resolve. **Decisão**: duração via sonda num
   elemento **destacado** (`document.createElement("audio")`) — o visível
   nunca é mutado; quando `durationHint` existe nem sonda.
3. **Horário +3h** — `format.dateTime` roda server-side e o container é
   UTC (next-intl sem `timeZone` configurado). **Decisão**: componente
   client `LocalDateTime` (`useFormatter` → fuso do browser,
   `suppressHydrationWarning`) nos pontos server-rendered do inbox;
   mensagens interpoladas viram `t.rich` com tag `<date>`.

## Escopo

packages/channels/src/adapters/waha.ts
packages/channels/src/adapters/waha-actions.ts
packages/channels/src/adapters/waha-chat.test.ts
packages/core/src/modules/messaging/message-views.ts
packages/core/src/modules/messaging/message-views.int.test.ts
apps/web/src/components/audio-player.tsx
apps/web/src/components/local-date-time.tsx
apps/web/src/components/message-item.tsx
apps/web/src/components/conversation-pane.tsx
apps/web/src/components/conversation-aside.tsx
apps/web/src/components/inbox-queue-list.tsx
apps/web/src/components/ticket-actions.tsx
apps/web/src/app/app/inbox/page.tsx
apps/web/messages/pt-BR.json

## Fora de escopo

- Demais datas server-rendered (audit, contacts, members, ai) — mesmo
  bug sistêmico, registrado no TODO.md para tratamento próprio.
- Mover mídia inbound pro S3; STT; avatar — já mapeados.
- Descriptografar `.enc` do CDN na mão (HKDF+AES) — último recurso se o
  `media.filename` também não existir.

## Tarefas

1. WAHA: `wahaFetchMessageMediaUrl` retorna `{ url, filename, error }`
   (parse `media.url ?? mediaUrl`, `media.filename`, `media.error`);
   `fetchMessageMedia` tenta `url` (guard de origem), cai pra
   `/api/files/{filename}` e, sem nada, lança erro distinguível.
   Testes mockFetch dos 3 cenários.
2. Core: `resolveMessageMedia` loga `warn` por estágio (url/by-id) com
   `err.message` — sem vazar URLs assinadas.
3. UI: `AudioPlayer` — sonda destacada (cria `<audio>` solto, lê duração
   no `loadedmetadata`/`timeupdate`, descarta); `durationHint` pula a
   sonda; `durationchange` no elemento real também alimenta `duration`.
4. UI: `LocalDateTime` client component; substitui `format.dateTime`
   server-side em `message-item` (3×), `conversation-pane`, `conversation-aside`,
   `inbox/page` + `ticket-actions`/`inbox-queue-list` (snoozedLabel);
   mensagens com data interpolada viram `t.rich` + tag `<date>` em pt-BR.json.
5. Gate + docs + re-smoke.

## Critérios de pronto

- [ ] `pnpm verify` verde
- [ ] Testes alvo: `waha-chat.test.ts` (filename fallback + erro de
      download), `message-views.int.test.ts`
- [ ] Docs: `waha-setup.md`, `TODO.md`
- [ ] Re-smoke staging: figurinha renderiza (ou log aponta a causa real),
      áudio toca, horários no fuso do usuário
