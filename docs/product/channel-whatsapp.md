# Canal WhatsApp (WAHA) — spec de produto

Spec de comportamento do canal WhatsApp via WAHA (engine GOWS). Até aqui
as features nasceram de briefs de implementação; este documento é a fonte
de verdade do **que o canal deve fazer**. Setup/ops continua em
`docs/development/waha-setup.md`; evidências em
`docs/product/omnichannel-research.md` §2–3.

Decisões tomadas em 2026-10-13 (escopo "tudo WAHA" aprovado pelo
fundador). Status: spec para o plano 1 (WAHA); o plano 2 (UI de
atendimento) é separado.

## 1. Ciclo de vida e pareamento (estado: implementado)

- Sessão por conexão, nome = slug do nome + sufixo; webhook por sessão
  com HMAC + retries exponenciais (~21min).
- QR (auto-refresh) + pairing code; `sendSeen` só ao assumir o ticket.
- Reconciliador pg-boss a cada 30min + ao conectar (backfill idempotente).
- Health card: versão do servidor + warnings `reachoutTimelock`/
  `messageCapping`.

## 2. App `brazilian-phone-numbers` (9º dígito)

- **Zero código** — apps são habilitados por env no WAHA, não por
  `config` de sessão (verificado na doc oficial: "No per-session
  config"). `WAHA_APPS_ON=brazilian-phone-numbers` já está no staging e
  ativa o app em todas as sessões com a config padrão
  (`strict:false` — avisa no log e envia pro melhor chute; `lookup:true`;
  cache memória 24h + persistente 31d).
- **Env ops (falta em staging/prod — usuário aplica via Coolify)**:
  `WAHA_APPS_ENABLED=True` e `WAHA_API_KEY_PLAIN=<senha em texto plano>`
  (alguns apps exigem a chave plana; convive com `WAHA_API_KEY` sha512 e
  deve ser o mesmo segredo antes do hash).
- Sem o app, envio a número BR com ambiguidade 8↔9 dígitos usa o chute
  bruto — silencioso e errático.

## 3. Mídia outbound (arquivo/imagem/vídeo/áudio)

- Fluxo mantido: upload → RustFS (`tenantObjectKey`) → URL assinada (1h)
  → WAHA baixa → `sendImage|sendVideo|sendFile|sendVoice`.
- **Pré-requisito de ambiente**: o host do `STORAGE_S3_ENDPOINT` precisa
  resolver dentro da rede do WAHA (mesmo projeto Coolify). Bucket precisa
  existir — staging hoje falha aqui (`NoSuchBucket`-like; ver §7 ops).
- **`sendVoice`**: mimetype do corpo fixo `audio/ogg; codecs=opus` +
  filename `.ogg` quando `voiceNote` (o MediaRecorder gera webm —
  `convert:true` transcodifica; o mimetype do payload é o do alvo, não
  o da fonte). Documento/imagem/vídeo mantêm mimetype real.
- Falha de provider grava mensagem `status=failed` (já existe) — a ação
  de reenviar é item de UI (plano 2).

## 4. Mídia inbound e retenção

- **Decisão**: mídia do WAHA vai para S3 (RustFS) — aplicar
  `WAHA_MEDIA_STORAGE=S3` + `WAHA_S3_*` + lifecycle 7d no bucket —
  **com `WAHA_S3_PROXY_FILES=True`**, de modo que `media.url` continue
  sendo URL servida pelo host WAHA (proxy) e o `fetchMedia` atual siga
  funcionando (o guard SSRF rejeita origens fora do WAHA).
- Alternativa rejeitada: `PROXY_FILES=False` (URL assinada direta do
  RustFS) quebraria o proxy atual; só reconsiderar se quisermos servir
  mídia inbound sem passar pelo WAHA — exigiria whitelist da origem do
  storage no adapter (mudança deliberada, não acidental).
- Documentar que mídia >7d expira no player (404 esperado); reconciler
  não rebusca mídia expirada.

## 5. Áudio inbound — transcrição (STT)

- Inbound `mediaKind=audio` dispara job pg-boss `transcribe-audio`
  (enqueue no ingest, best-effort — falha não bloqueia a mensagem).
- Job: `fetchMedia` do provider → STT via credencial BYOK da org
  (`@crm/ai`; `callKind="stt"` em `ai_usage_events`) → grava
  `metadata.transcript` na mensagem + evento de domínio p/ SSE.
- Sem credencial BYOK configurada → job no-op (sem erro).
- Modelo STT hoje hardcoded (`whisper-1` OpenAI / `gemini-2.0-flash-001`
  OpenRouter) — vira o _default_ do campo "voice model" da credencial
  BYOK quando a seleção de modelo por credencial existir
  (ai-agents.md → BYOK + fallback).
- Transcript entra no transcript do observer/drafter (áudio deixa de ser
  conteúdo morto para IA) e renderiza sob o player no thread (plano 2).
- Toggle: `organization_settings.ai_transcribe_audio` default `true`
  (settings/ai já é o lugar de toggles de IA).
- Fora de escopo: TTS/resposta em voz, preferência de canal por contato
  (fazer.ai faz; registrar como roadmap).

## 6. Avatar do contato

- `contacts.avatarUrl` existe e nunca é populado.
- `GET /api/contacts/profile-picture?contactId=&session=` (WAHA) →
  download → RustFS `tenantObjectKey(org,"contact-avatar",contactId)` →
  `avatarUrl` = rota proxy (`/api/contacts/[id]/avatar` ou reuso do
  media proxy). Fallback: iniciais.
- Gatilho: no upsert do contato (criação) e heal lazy — ao abrir
  conversa cujo contato tem `avatarUrl` nulo, enfileirar fetch (não
  bloquear o render).

## 7. Não-lido por conversa (reverte non-goal do inbox.md)

- Nova tabela `conversation_reads (organization_id, conversation_id,
user_id, last_read_at)` — cursor por usuário (RLS, tenant-owned).
- Marca `last_read_at=now()` quando o usuário **abre** a conversa
  (cliente dispara action ao montar o pane) e quando **envia** mensagem.
- Lista: `unread_count` = mensagens inbound com `created_at >
last_read_at` (cursor nulo = tudo não-lido); badge numérico + preview
  em peso médio→bold na row.
- Escopo: contadores por usuário; "não-lido" não afeta as views
  (Fila/Minhas seguem iguais) nem ordenação (segue `last_message_at`).

## 8. Identidade `@lid` e envio

- Inbound já trata `@lid` ponta a ponta. Outbound para `@lid`: permitido
  (GOWS/whatsmeow resolve LID); sem phone conhecido não há como validar
  com `checkNumberStatus` — documentado como limitação do canal, não bug.
- NewConversationDialog segue exigindo telefone (contato outbound-first
  nasce por PN, não por LID).

## 9. Envelope anti-ban no envio

- **Automatizado** (off-hours reply, aprovação de draft): sempre
  `sendSeen` → `typing` por `clamp(len×120ms,1s,4s)` → `sendText`
  (sequência oficial do WAHA; já documentada no waha-setup).
- **Humano**: `sendSeen` é sinal de **leitura**, nunca de resposta — dispara
  só quando o humano lê: ao assumir o ticket (pickup já fazia) e em
  `markConversationRead` quando a última msg é inbound e o leitor é o
  assignee (ou a conversa não tem dono — pending: quem abre pra responder).
  Respeita `users.sendSeen`. Send/resend humano NÃO marcam seen (decisão
  2026-10-13, refine do spec original).
- `presence:"offline"` global não implementado — registrar como pendência
  menor (AUTO_ONLINE=False já cobre o caso principal).

## 10. Ops — checklist de ambiente (não é código)

Staging (aplicado 2026-10-13 via REST API `/api/v1/applications/{uuid}/envs`):

- RustFS: bucket `bosun` (= `STORAGE_S3_BUCKET` do staging) — confirmado
  existente; `RUSTFS_ACCESS_KEY/SECRET_KEY` = `STORAGE_S3_*` do app.
- WAHA (aplicado): `WAHA_APPS_ENABLED=True`, `WAHA_API_KEY_PLAIN=<plain>`,
  `WAHA_MEDIA_STORAGE=S3`, `WAHA_S3_ENDPOINT=http://bosun-staging-rustfs:9000`,
  `WAHA_S3_BUCKET=bosun`, `WAHA_S3_ACCESS_KEY_ID/SECRET` (mesmas do RustFS),
  `WAHA_S3_REGION=us-east-1`, `WAHA_S3_FORCE_PATH_STYLE=True`,
  `WAHA_S3_PROXY_FILES=True`, `WAHA_EVENTS_DOWNLOAD_MEDIA=true`.
- Prod (pendente, mesmo checklist): replicar as envs WAHA no app de produção
  apontando o rustfs de prod; bucket de prod = `STORAGE_S3_BUCKET` de prod.
- App: nenhuma env nova (reusa `STORAGE_S3_*`); verificar que
  `STORAGE_S3_ENDPOINT` resolve a partir do container WAHA.

## 11. Verificação

- Upload + send de documento e PTT reais no staging (device pareado).
- Inbound: áudio chega, toca no player, transcript aparece (com BYOK).
- Mídia inbound após aplicar S3: URL servida via WAHA proxy (PROXY_FILES).
- Avatar aparece em contato novo; heal funciona em contato antigo.
- Não-lido: badge aparece, zera ao abrir, não reseta entre usuários.

## Fora de escopo (este spec)

- TTS/voz de saída, debounce de rajadas para IA (registrar no roadmap),
  handoff IA→humano (intake `pending`), campanhas/broadcast (anti-ban),
  grupos, polls/buttons/lists (sem suporte GOWS ou fora de produto),
  Meta Cloud (outro provider), CSAT, SLA targets.
