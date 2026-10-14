# Todo — Canal WhatsApp: destravar mídia + higiene (plano 1/3)

- [x] **1. Apps na sessão WAHA** — ops-only (verificado: `WAHA_APPS_ON`
      habilita global, sem per-session config); envs `WAHA_APPS_ENABLED` + `WAHA_API_KEY_PLAIN` entram no checklist da task 9
- [x] **2. sendVoice mimetype** — já correto (`convert:true` + rota
      sendVoice); nenhuma mudança de código necessária · verificado:
      `waha-chat.test.ts` (49 testes)
- [x] **3. Migration** — `conversation_reads` (RLS FORCE) +
      `ai_transcribe_audio` (default true) aplicada
      (`0030_bitter_mercury.sql`) · int test cross-org passando
- [x] **4. Cursor de não-lido** — markConversationRead + unread_count na
      list query + mark-on-send · mark-on-open (UI) fica pro plano 2 ·
      verify: `reads.int.test.ts` 5 testes
- [x] **5. Avatar** — fetchContactAvatar → RustFS (`tenantObjectKey`) →
      `metadata.avatarKey` + rota `/api/contacts/[id]/avatar` + enqueue
      atômico no ingest · verify: unit + typecheck web/automation
- [x] **6. STT** — transcribeAudio (@crm/ai: whisper-1 + openrouter
      audio-model) + job `transcribe-audio` no ingest → metadata.transcript + `message.updated` + toggle em settings/ai · verify:
      transcribe.test.ts 4/4 + int test 4/4
- [x] **7. Envelope anti-ban** — `sendWithEnvelope` (seen → typing ∝len
      → paused → send) em sends automatizados (off-hours + approveDraft);
      send humano faz sendSeen só se última msg foi inbound · verify:
      outbound.int.test.ts 7/7
- [x] **8. @lid outbound** — verificado: `message.to` passa verbatim pro
      chatId; GOWS resolve LID · teste de payload no channels.test.ts
- [x] **9. Ops staging** — envs WAHA aplicadas via REST API do Coolify
      (11 envs, WAHA reiniciado healthy); bucket `bosun` já existia
      (confirmado via terminal do container). **Resta só o smoke real
      com device pareado** (enviar arquivo/PTT, receber áudio, blue ticks)
- [x] **10. Docs** — waha-setup.md (PROXY_FILES=True obrigatório),
      TODO.md, channel-whatsapp.md, todo.md

- [x] **Review** — aprovado; fixes aplicados: `aiTranscribeAudio` na
      assinatura de `upsertSettings` + `conversationId` no evento
      `message.updated` do STT. Opcionais registrados (allowlist/size-cap
      no avatar fetch, prefix-check do `avatarKey`, model real no usage
      record de STT)

Gate final: `pnpm verify:full` ✅ + smoke de mídia real no staging
(pendente ops — task 9).
