# Plan — Canal WhatsApp: destravar mídia + higiene completa (plano 1/3)

- **Origem**: `TODO.md` → WAHA chat features · `docs/product/channel-whatsapp.md`
  (spec aprovado) · `docs/product/omnichannel-research.md` §2–3
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-13

## Objetivo

Canal WAHA confiável e completo: mídia enviando/recebendo em staging, app
de 9º dígito ativo, áudio inbound transcrito, avatar do contato populado,
cursor de não-lido por usuário e envelope anti-ban no envio.

## Contexto

- Spec `docs/product/channel-whatsapp.md` é a fonte — escopo "tudo WAHA"
  aprovado pelo fundador em 2026-10-13 (inclui reversão do non-goal de
  não-lido).
- **Plano 1 é backend/plumbing + ops.** A superfície de UI que consome
  esses primitivos (badge de não-lido, avatar na row, transcript sob o
  player, "Reenviar") é plano 2 — aprovado na ordem WAHA → superfície →
  E2/E3. Única exceção: o toggle `ai_transcribe_audio` em
  `/app/settings/ai`, que é o interruptor da feature STT.
- **STT provisório**: usa a credencial BYOK da org que suportar áudio,
  na ordem de prioridade — OpenAI `whisper-1`; OpenRouter via modelo
  audio-capable (chat.completions); Anthropic não tem STT → job vira
  no-op silencioso quando nenhuma credencial servir.
- **Mídia inbound**: WAHA S3 com `WAHA_S3_PROXY_FILES=True` — `media.url`
  continua no host WAHA e o guard SSRF do `fetchMedia` não muda. Ops,
  não código.
- **Cursor de não-lido**: `conversation_reads` por usuário; marca ao
  abrir a conversa e ao enviar. Badge/count na lista é plano 2 — aqui
  entra tabela + service + action + `unread_count` na query da lista.
  **Decisão 2026-10-13**: mark-on-open (client component no pane) adiado
  para o plano 2 — manter `apps/web` fora do escopo exceto server/.
- **Sintoma reportado**: ticks azuis (read receipts) não funcionam nem
  no cliente nem no remoto — verificar ack ingest + sendSeen no task 7.
- **Ops staging**: bucket `crm` pode ser criado rodando `storage:init`
  com as envs de `.coolify-secrets.tmp` (se presentes); demais envs
  (`WAHA_APPS_*`, `WAHA_S3_*`) são checklist pro usuário no Coolify UI —
  MCP não escreve envs.

## Escopo

packages/channels/**
packages/core/src/modules/messaging/**
packages/core/src/modules/contacts/**
packages/core/src/modules/drafts/**
packages/core/src/modules/organizations/**
packages/core/src/modules/ai/**
packages/db/**
packages/automation/**
packages/ai/**
apps/web/src/server/**
apps/web/src/app/api/contacts/**
apps/web/src/app/api/webhooks/**
apps/web/src/app/app/settings/**
apps/web/messages/**
docs/**
TODO.md
tasks/**

## Fora de escopo

- Qualquer superfície de UI no inbox (badge não-lido, avatar na lista,
  transcript sob player, Reenviar, player com velocidade, toggle do
  aside, histórico do contato) — plano 2.
- E2/E3 (ficha de contato, macros, busca no thread, menu de contexto,
  atalhos, consumer sendSeen) — plano 3.
- `presence:"offline"` global, intake `pending`, handoff IA→humano,
  TTS/voz de saída, debounce de rajadas.
- Mudar `WAHA_S3_PROXY_FILES` para `False` (manter `True` — decisão §4
  do spec).
- Commit/push/PR — só sob pedido explícito.

## Tarefas

1. ~~**Sessão WAHA com apps**~~ → **ops-only** (verificado na doc:
   `WAHA_APPS_ON` habilita globalmente; sem per-session config). Virou
   item do checklist de envs (task 9): `WAHA_APPS_ENABLED=True` +
   `WAHA_API_KEY_PLAIN`.
2. **sendVoice mimetype**: `voiceNote` força `audio/ogg; codecs=opus` +
   filename `.ogg` (convert:true já transcodifica webm) + teste.
3. **DB**: migration única — `conversation_reads` (org, conversation,
   user, last_read_at; `pgPolicy` + RLS FORCE + grants `crm_app`) e
   `organization_settings.ai_transcribe_audio` (bool default true) +
   int test de isolamento cross-org.
4. **Cursor de não-lido**: service `markConversationRead` +
   `unread_count` na query da lista + action `markConversationReadAction`
   disparada ao abrir conversa (cliente) e dentro de `sendOutboundMessage`
   (autor). Sem badge (plano 2) — dados apenas.
5. **Avatar**: contrato `fetchContactAvatar` no provider + impl WAHA
   (`/api/contacts/profile-picture` → baixa URL CDN → RustFS
   `contact-avatar` key → `contacts.avatarUrl`); job `contact-avatar` no
   upsert do contato + heal lazy se `avatarUrl` nulo ao abrir conversa;
   rota autenticada `GET /api/contacts/[id]/avatar` servindo o objeto.
6. **STT**: `transcribeAudio` em `@crm/ai` (whisper-1 / openrouter
   audio-model; Anthropic skip) + `ai_usage_events callKind='stt'` +
   job `transcribe-audio` enfileirado no ingest quando `mediaKind=audio`
   → `metadata.transcript` + evento de domínio; toggle em
   `/app/settings/ai`.
7. **Envelope anti-ban**: `sendSeen` no momento do send se último inbound
   ainda não visto; envio automatizado (off-hours, draft aprovado) faz
   seen → typing ∝len (clamp 1–4s) → send. Em `outbound.ts` +
   maybeSendOffHoursReply/approve draft.
8. **@lid outbound**: verificar adapter envia para `<lid>@lid`
   (provável zero-código); documentar limitação em `channel-whatsapp.md`.
9. **Ops staging**: criar bucket `crm` no RustFS staging (storage:init
   com envs de `.coolify-secrets.tmp` — escalcar se ausentes); checklist
   de envs WAHA S3/apps pro usuário; smoke test upload+presign.
10. **Docs**: atualizar `waha-setup.md` (mídia S3 + PROXY_FILES + envs de
    apps) e `TODO.md`.

## Critérios de pronto

- [x] `pnpm verify:full` verde (DB + providers) — 2026-10-13
- [x] Testes alvo: `waha-*.test.ts` (avatar/@lid), `conversation_reads`
      int test RLS (5), STT int test (4), envelope outbound int test (7)
- [ ] Staging: upload de arquivo/PTT real funciona (device pareado) —
      **bloqueado no usuário**: bucket `crm` + envs WAHA no Coolify UI
- [x] Docs atualizadas: `waha-setup.md`, `channel-whatsapp.md`,
      `TODO.md`
- [x] Checklist de envs WAHA entregue ao usuário (Coolify UI) —
      `channel-whatsapp.md` §10 + TODO.md
