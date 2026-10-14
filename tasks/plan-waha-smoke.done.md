# Plan — Smoke WAHA staging: figurinha/mídia inbound, microfone, upload grande

- **Origem**: smoke com device pareado em staging (2026-10-14) · `TODO.md` → WAHA "Revisão 2026-10-13" · `docs/product/channel-whatsapp.md`
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-14

## Objetivo

Fazer mídia recebida do WhatsApp aparecer, gravação de áudio funcionar e
envio de arquivo grande completar (ou falhar com mensagem) — os três
bugs do primeiro smoke real.

## Contexto

Três falhas reportadas no smoke, causa confirmada em cada uma (logs do
app `bosun-staging` via Coolify MCP + código):

1. **Figurinha (e toda mídia inbound) quebrada** — log
   `WAHA fetchMedia refused: url outside the WAHA host` em `api.media`.
   O WAHA monta `media.url` com o **próprio** `WAHA_BASE_URL` (default
   `http://localhost:3000`, doc oficial), enquanto o app fala com o host
   interno `http://bosun-staging-waha:3000`. A checagem de origem do
   `fetchMedia` (anti-vazamento do `X-Api-Key`) recusa. Afeta imagem,
   áudio, documento e o job de STT — não só sticker.
   **Decisão**: quando o path for `/api/files/...`, re-enraizar
   `pathname + search` no `baseUrl` confiável (a key nunca sai do host
   configurado, independe da config do container WAHA). Qualquer outra
   URL de origem diferente continua recusada. Não exigir prefixo de
   sessão no path — o formato do WAHA varia (`/api/files/<id>` e
   `/api/files/<session>/<id>`).
2. **"Não foi possível acessar o microfone"** — `next.config.ts` envia
   `Permissions-Policy: microphone=()`, que bloqueia `getUserMedia` em
   todas as páginas. **Decisão**: `microphone=(self)`; camera/geolocation
   seguem bloqueados.
3. **Upload de `.msi` travou o composer em "Enviando arquivo…"** — log
   `Request body exceeded 10MB for /app/inbox…`. Dois limites do Next
   abaixo do contrato de 64 MB (`MAX_UPLOAD_BYTES`): proxy buffer
   (`experimental.proxyClientMaxBodySize`, default 10 MB — `proxy.ts`
   casa a rota da página) e Server Actions
   (`experimental.serverActions.bodySizeLimit`, default **1 MB** — fotos
   de celular também falhariam). A action rejeita no transporte e o
   `.then()` sem `.catch` nunca reseta `sendingMedia`. **Decisão**: ambos
   em `"65mb"` (64 MB + overhead multipart); composer e gravador ganham
   tratamento de rejeição (toast + reset) e checagem de tamanho no
   client antes de subir.

Custo aceito v1: upload até 64 MB passa bufferizado em memória pelo
proxy + action (RustFS é interno, sem presigned PUT direto do browser).

## Escopo

packages/channels/src/adapters/waha.ts
packages/channels/src/adapters/waha-chat.test.ts
apps/web/next.config.ts
apps/web/src/components/composer.tsx
apps/web/src/components/voice-recorder.tsx
apps/web/src/lib/media-upload.ts
apps/web/messages/pt-BR.json

## Fora de escopo

- Mídia inbound no S3 do WAHA (expira em 7d no local) — plano próprio.
- Linha "Evento do sistema" sem texto vista no smoke — investigar à parte.
- Upload direto browser→storage (presigned PUT).
- Config do container WAHA (`WAHA_BASE_URL` dele) — o fix no app torna
  desnecessária.

## Tarefas

1. `fetchMedia` re-enraíza `/api/files/*` no `baseUrl` + testes.
2. `next.config.ts`: `microphone=(self)` + `serverActions.bodySizeLimit`
   e `proxyClientMaxBodySize` em `"65mb"`.
3. Composer/gravador: catch de rejeição + reset + checagem de tamanho no
   client + chaves i18n.
4. Gate + docs (`waha-setup.md`, `TODO.md`) + re-smoke em staging após
   deploy.

## Critérios de pronto

- [ ] `pnpm verify` verde
- [ ] Testes alvo: `packages/channels` `waha-chat.test.ts` (re-root + recusa preservada)
- [ ] `pnpm build` verde (config do Next válida)
- [ ] Docs atualizadas: `docs/development/waha-setup.md`, `TODO.md`
- [ ] Re-smoke em staging: figurinha/imagem inbound, áudio gravado, arquivo >10 MB
