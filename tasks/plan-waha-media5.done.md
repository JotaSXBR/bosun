# Plan — waha-media5 (figurinha: presign http + waveform no player)

- **Origem**: `TODO.md` → re-smoke 3 (figurinha ainda 404; áudio toca sem waveform)
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-14

## Objetivo

Destravar a figurinha inbound cobrindo a URL pré-assinada `http://` que o
WAHA+S3 estampa, e dar ao player de áudio uma waveform navegável
(padrão WhatsApp) no preview do gravador e na bolha enviada/recebida.

## Contexto

Evidência do smoke 2026-10-14 ~16:42 (warns novos no log de staging):

- `media url fetch failed: refused` — `media.url` do webhook é o CDN
  `mmg.whatsapp.net/…enc` (esperado, nunca buscamos).
- `media by-id download failed — last: refused` → a resposta
  `downloadMedia=true` trouxe `media.url` que não passou no guard e não era
  fetchável anonimamente: `isAnonymousFetchable` só aceita `https:` e a
  presign do S3 provavelmente sai `http://` (endpoint interno do RustFS),
  com `media.filename` ausente (nenhum path `/api/files/*` tentado).
- `media by-id download failed — last: HTTP 404` → `filename` presente,
  todos os candidatos `/api/files/*` 404 porque `WAHA_MEDIA_STORAGE=S3` e o
  disco local não tem o objeto (sem `WAHA_S3_PROXY_FILES`).

Decisões:

- Fetch anônimo passa a aceitar `http:` e `https:` **apenas** para a URL
  devolvida pela resposta autenticada do `downloadMedia` (origem confiável
  — WAHA interno; o `media.url` do webhook continua só pelo guard de
  origem). `*.whatsapp.net` segue excluído (blob `.enc` criptografado).
- O erro de recusa passa a carregar o **origin** da URL (protocolo+host,
  sem path/query — nada de assinatura em log), para o próximo smoke dizer
  exatamente o que o WAHA estampa.
- Ops (fora do código): recomendar `WAHA_S3_PROXY_FILES=True` — com proxy,
  `/api/files/*` serve o S3 e a cadeia de paths volta a funcionar.
- Waveform: peaks extraídos de verdade via `OfflineAudioContext.decodeAudioData`
  em `apps/web/src/lib/audio-peaks.ts` (`peaksFromChannel` pura e testável);
  falha de decode (Safari/webm) → barras planas determinísticas — UI nunca
  quebra. Player aceita `peaks?` (gravador computa do blob uma vez) ou
  computa lazy via fetch+decode do `src`.

## Escopo

packages/channels/src/adapters/**
apps/web/src/components/audio-player.tsx
apps/web/src/components/voice-recorder.tsx
apps/web/src/lib/**
apps/web/messages/**

## Fora de escopo

- Copiar mídia inbound pro storage tenant (`tenantObjectKey`) — design de
  longo prazo, já no TODO.
- `WAHA_S3_PROXY_FILES` e demais envs do WAHA — ops no Coolify, usuário aplica.
- Datas server-rendered fora do inbox (débito anotado no TODO).
- Waveform no `<video>` ou outros players — só `AudioPlayer`.

## Tarefas

1. **Adapter**: `isAnonymousFetchable` aceita `http:`+`https:` fora de
   `*.whatsapp.net`; recusa do `resolveMediaUrl` inclui `origin` da URL no
   erro (sem path/query). Testes em `waha-chat.test.ts`: presign `http://`
   buscado anonimamente sem api key; `mmg.whatsapp.net` nunca buscado;
   mensagem de erro carrega o origin recusado.
2. **`lib/audio-peaks.ts`**: `peaksFromChannel(Float32Array, count)` pura
   (max|sample| por bucket, normalizado 0..1, min-height) +
   `decodeAudioPeaks(bytes, count)` via `OfflineAudioContext` +
   `fallbackPeaks(count)` determinístico. `audio-peaks.test.ts` cobre a
   função pura (silêncio, sinal, normalização).
3. **`AudioPlayer`**: prop `peaks?: number[]`; sem prop, lazy
   fetch(src)→decode→peaks (falha → fallback). Renderiza barras com fill
   por progresso; click e setas ←/→ fazem seek (`role="slider"`, aria-*);
   mantém botão play/pause, tempo e velocidade.
4. **`VoiceRecorder`**: ao entrar em preview, decodifica o blob → peaks →
   passa `peaks`+`durationHint` pro `AudioPlayer` do `PreviewBar`.
5. **Docs + gate**: `waha-setup.md` (presign http coberto; recomendação
   `WAHA_S3_PROXY_FILES=True`), `TODO.md` (re-smoke 4). `pnpm verify` +
   `pnpm test:integration` + `pnpm build`.

## Critérios de pronto

- [ ] `pnpm verify` verde; `test:integration` + `build` verdes (provider tocado)
- [ ] Testes novos do adapter cobrindo presign http + origin no erro
- [ ] `audio-peaks.test.ts` cobre `peaksFromChannel`
- [ ] Docs atualizadas: `docs/development/waha-setup.md`, `TODO.md`
- [ ] Re-smoke em staging (figurinha renderiza; waveform aparece e faz seek)
