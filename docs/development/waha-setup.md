# WAHA — setup e pairing (pesquisa pré-brief)

Pesquisa feita em 2026-10-06 sobre a documentação oficial
(`waha.devlike.pro`, engine **GOWS**) + estado atual do repo. Alimenta o
brief do slice "WAHA go-live". Fontes no fim do arquivo.

## Estado atual

**Já existe:**

- `WahaChannelProvider` (`packages/channels/src/adapters/waha.ts`):
  create/start/stop session, `sendText`/`sendImage`/`sendVideo`/`sendFile`,
  parse de `message`/`message.ack`/`session.status`, HMAC-SHA512
  (`X-Webhook-Hmac`) **obrigatório**, fetch de QR
  (`GET /api/{session}/auth/qr`, `Accept: application/json` → base64).
- `channel_connections` (`kind='waha'`, credenciais AES-256-GCM, webhook
  token), ingest + outbound end-to-end, `/app/integrations` (cria conexão,
  mostra URL do webhook, refresh/remove).
- Coolify: app `waha` `devlikeapro/waha:gows` healthy em staging e prod;
  `WAHA_BASE_URL`/`WAHA_API_KEY`/`WAHA_WEBHOOK_HMAC_KEY` setadas no app
  bosun-staging (verificado via MCP).

**Gaps identificados → fechados no slice "WAHA go-live" (implementado):**

1. ~~QR descartado~~ — `refreshConnectionStatus` retorna `{connection,
status, qrCode}`; o action `connectChannelConnectionAction` propaga e o
   `PairingPanel` faz poll a cada 15s (QR gira a cada ~20s).
2. ~~Sem `config.webhooks`~~ — `connect()` registra o webhook da conexão
   (`APP_URL/api/webhooks/channels/<token>` + HMAC + 7 eventos + retries
   exponenciais) via PUT full-replace na sessão.
3. ~~Session hardcoded~~ — nome escolhido pelo usuário no form
   (`credentials.session`, regex `[a-zA-Z0-9_-]+`), fallback `conn_<hex>`.
4. Envs de produção do container WAHA incompletas (ver abaixo) — checklist
   de deploy no Coolify, não é código.
5. Media: `media.url` do webhook aponta para a URL interna do WAHA e expira
   (`WHATSAPP_FILES_LIFETIME` default **180s**) — decisão tomada: S3/RustFS
   com 7 dias (env do container, checklist de deploy).

**Também implementado no slice:** pairing code (`requestPairingCode` →
`POST /api/{s}/auth/request-code`), lifecycle stop/restart/logout, card de
saúde (`getSessionInfo` + `getServerInfo`), reconciliador pg-boss
`channel-messages-reconcile` (`*/30 * * * *` + enqueue ao conectar) que
faz backfill via `listChats`/`listMessages` com dedup por `externalId` —
sem fan-out de `process-channel-event` (não dispara auto-reply off-hours
em mensagens antigas).

## Envs do container WAHA (produção)

### Obrigatórias / núcleo

| Env                             | Valor                           | Nota                                                                                  |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `WHATSAPP_DEFAULT_ENGINE`       | `GOWS`                          | Já setada (doc Coolify).                                                              |
| `WAHA_API_KEY`                  | `sha512:{hash}`                 | Prefere hash sobre plain — o plain fica fora do env.                                  |
| `WHATSAPP_API_KEY_EXCLUDE_PATH` | `ping,health`                   | **A variante `WHATSAPP_`, não `WAHA_`** — já documentado; errar quebra o healthcheck. |
| `REDIS_URL`                     | `redis://...@<redis-uuid>:6379` | Já setada (jobs internos do WAHA).                                                    |
| `WAHA_WORKER_ID`                | `bosun-<env>`                   | Identifica o worker p/ restore de sessões.                                            |
| `TZ`                            | `America/Sao_Paulo`             | Logs e timestamps coerentes.                                                          |

### Restart/persistência

| Env                             | Valor            | Nota                                                                                                         |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `WHATSAPP_RESTART_ALL_SESSIONS` | `True`           | Restarta sessões STOPPED após restart do container — essencial p/ prod.                                      |
| `WAHA_AUTO_START_DELAY_SECONDS` | `0`              | OK com poucas sessões.                                                                                       |
| `WAHA_NAMESPACE`                | `all`            | **Recomendado p/ novos setups** — o default é o nome do engine; trocar de engine depois perderia as sessões. |
| `WAHA_LOCAL_STORE_BASE_DIR`     | `/app/.sessions` | Volume já montado.                                                                                           |

### Segurança

| Env                                   | Valor           | Nota                                                             |
| ------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `WAHA_DASHBOARD_ENABLED`              | `true`          | Sem FQDN — só rede interna; útil p/ debug via proxy do Coolify.  |
| `WAHA_DASHBOARD_USERNAME`/`_PASSWORD` | aleatório       | Default é `waha/waha`.                                           |
| `WHATSAPP_SWAGGER_ENABLED`            | `false` em prod | Staging pode manter com `WHATSAPP_SWAGGER_USERNAME`/`_PASSWORD`. |
| `WAHA_LOG_FORMAT`                     | `JSON`          | Log shipping consistente com o resto do stack.                   |
| `WAHA_LOG_LEVEL`                      | `info`          | `debug`/`trace` geram volume excessivo.                          |
| `WAHA_HTTP_LOG_LEVEL`                 | `info`          | Access log HTTP.                                                 |

### Media

| Env                          | Valor                                                          | Nota                                                                   |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `WHATSAPP_FILES_FOLDER`      | `/app/.media`                                                  | Volume já montado.                                                     |
| `WAHA_MEDIA_STORAGE`         | `S3` (decidido)                                                | **RustFS** do mesmo ambiente.                                          |
| `WAHA_S3_*`                  | endpoint RustFS, bucket, keys, `WAHA_S3_FORCE_PATH_STYLE=True` | `WAHA_S3_PROXY_FILES=False` → `media.url` vira pre-signed URL.         |
| Retenção de mídia            | **7 dias** (decidido)                                          | Com S3, expiração é lifecycle rule no bucket RustFS (não env do WAHA). |
| `WAHA_EVENTS_DOWNLOAD_MEDIA` | `true` (default)                                               | Download da mídia nos eventos de webhook.                              |

### Filtros na fonte (economiza webhook + evita ticket lixo)

| Env                                    | Valor             | Nota                                                        |
| -------------------------------------- | ----------------- | ----------------------------------------------------------- |
| `WAHA_SESSION_CONFIG_IGNORE_STATUS`    | `true`            | Ignora `status@broadcast` (stories).                        |
| `WAHA_SESSION_CONFIG_IGNORE_GROUPS`    | `true` (decidido) | Sem grupos no início — mensagens `*@g.us` não viram ticket. |
| `WAHA_SESSION_CONFIG_IGNORE_CHANNELS`  | `true`            | Ignora `*@newsletter`.                                      |
| `WAHA_SESSION_CONFIG_IGNORE_BROADCAST` | `true`            | Ignora `*@broadcast`.                                       |

### GOWS tuning — history sync (decidido: off por default)

Sem limite o pareamento sincroniza **anos** de histórico → banda/storage.
Decisão: **não puxar histórico por padrão**; quando a importação for
desejada, ajustar os envs + restart do container + **re-pair** da sessão
(a doc exige re-pair para aplicar). São envs globais do container, não por
sessão — um seletor "importar últimas N horas/dias/semanas" por conexão na
UI só seria possível se o WAHA expuser isso no `config` da sessão
(hoje não expõe; fica como env global mesmo).

| Env                                                                | Valor                  | Nota                                                                                            |
| ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `WAHA_GOWS_DEVICE_HISTORY_SYNC_FULL_SYNC_DAYS_LIMIT`               | unset (off, decidido)  | Setar N dias quando a importação for desejada.                                                  |
| `WAHA_GOWS_DEVICE_HISTORY_SYNC_INITIAL_SYNC_MAX_MESSAGES_PER_CHAT` | ex. `100`              | Cap por chat no sync inicial quando ligado.                                                     |
| `WAHA_GOWS_DEVICE_HISTORY_SYNC_RECENT_SYNC_DAYS_LIMIT`             | ex. `30`               |                                                                                                 |
| `WAHA_GOWS_KEEPALIVE_INTERVAL_MIN/MAX`                             | unset (default 20–30s) | Só mexer se houver proxy que mata conexão idle.                                                 |
| `WAHA_CLIENT_DEVICE_NAME`/`_BROWSER_NAME`                          | unset (decidido)       | Sem device name custom — pairing code habilitado tem prioridade (custom quebraria o code flow). |

## Autenticação — QR e pairing code

Ambos os fluxos existem; a doc do WAHA manda **sempre ter QR como fallback**
(o pairing code nem sempre funciona). Endpoints reais:

| Ação                  | Endpoint                                | Body → Response                                                                                           |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Get QR                | `GET /api/{session}/auth/qr`            | `Accept: image/png` → binário · `Accept: application/json` → `{data: base64}` · `?format=raw` → valor cru |
| Pairing code          | `POST /api/{session}/auth/request-code` | `{phoneNumber: "5511999999999"}` → `{code: "ABCD-ABCD"}`                                                  |
| Update session        | `PUT /api/sessions/{session}`           | **config completa** (substitui, não faz merge)                                                            |
| Me (número conectado) | `GET /api/sessions/{session}/me`        | retorna o número/JID — útil p/ mostrar "conectado como +55..."                                            |

### QR — regras de ciclo de vida

- O primeiro QR expira em **60s**; os seguintes a cada **20s**, até **6 QRs**
  no total → depois a sessão vai para `FAILED` e precisa de `restart`.
- **Regra da doc**: a cada evento `session.status=SCAN_QR_CODE`, buscar um
  QR novo — a UI precisa re-fazer o fetch (auto-refresh), não exibir uma
  imagem estática.

### Pairing code — regras (decidido: habilitado, sem device name)

- `POST /api/{session}/auth/request-code` com `phoneNumber` (só dígitos,
  formato internacional `5511...`) → retorna `{code: "ABCD-ABCD"}` que o
  usuário digita em **WhatsApp → Aparelhos conectados → Conectar com
  número**.
- **Limitação documentada**: pairing code provavelmente **falha se device
  name custom estiver setada** — só o fluxo QR honra device name.
  **Decisão**: **não customizar device name** (`WAHA_CLIENT_*` unset e sem
  `config.client` na sessão) — pairing code é o fluxo prioritário, e o
  aparelho aparece com o nome default do WAHA em Aparelhos conectados.
- Statuses extras no meio do pairing: `PASSKEY_REQUIRED` /
  `PASSKEY_CONFIRMATION_REQUIRED` (WebAuthn) — raros; mapear para
  `connecting` já cobre.

### Statuses de sessão

`STOPPED` → `STARTING` → `SCAN_QR_CODE` → `WORKING` · `FAILED` ·
`PASSKEY_REQUIRED` / `PASSKEY_CONFIRMATION_REQUIRED` (WebAuthn — mapeamos
para `connecting`; maioria nunca atinge). Em `FAILED`: `restart`, senão
`logout` + `start`.

## Registro do webhook — por sessão, não global

- **Global** (`WHATSAPP_HOOK_URL` env): uma URL só p/ **todas** as sessões —
  não serve pro nosso modelo (cada conexão tem `webhookToken` próprio).
- **Por sessão**: `config.webhooks` no `POST /api/sessions` (create) ou
  `PUT /api/sessions/{session}` (update, config **full-replace** — sempre
  mandar a config inteira):

```json
{
  "name": "<session>",
  "config": {
    "webhooks": [
      {
        "url": "https://<app>/api/webhooks/channels/<webhookToken>",
        "events": [
          "message",
          "message.ack",
          "message.reaction",
          "message.edited",
          "message.revoked",
          "session.status",
          "presence.update"
        ],
        "hmac": { "key": "<WAHA_WEBHOOK_HMAC_KEY>" },
        "retries": { "policy": "exponential", "delaySeconds": 5, "attempts": 8 }
      }
    ]
  }
}
```

- O app precisa conhecer a **URL pública de si mesmo** p/ montar o webhook —
  `APP_URL` já existe nas envs.
- `message.ack` alimenta os ticks de enviado/entregue/lido;
  `session.status` mantém `connection.status` atualizado (inclusive
  WORKING após pareamento).

## Modelo de sessão (multi-tenant)

- Uma sessão WAHA = um número de WhatsApp. `name` é o ID da sessão.
- **Decidido**: nome da sessão **escolhido pelo usuário** na criação da
  conexão — `wahaCredentialsSchema.session` já existe como campo opcional
  (validar: `[a-zA-Z0-9_-]+`, sem espaços; fallback = `connection.id` se
  vazio). Único por WAHA — colisão entre conexões deve falhar com erro
  amigável.
- `external_ref` guarda o número pareado (de `GET /me`).
- `WAHA_NAMESPACE=all` evita prefixo por engine no storage.

## Fluxo de UI proposto (`/app/integrations`)

1. **Criar conexão** (nome + credenciais WAHA) — já existe.
2. **Botão "Conectar"** → `refreshConnectionStatus` (re)cria/religa a
   sessão **com `config.webhooks`** e retorna também `qrCode`.
3. **Modal de pareamento**: aba "QR code" (auto-refresh: server action que
   re-busca o QR a cada ~15s ou a cada `session.status` via SSE) + aba
   "Código de pareamento" (input de telefone → `request-code` → mostra
   `ABCD-ABCD`).
4. Status `connecting`/`SCAN_QR_CODE` → badge amarelo + QR; `connected` →
   mostra número (`/me`); `FAILED` → botão "Reiniciar sessão".
5. **Botão "Reconectar"** sempre visível na conexão: religa a sessão
   existente (`start`/`restart`) **sem QR novo** e dispara o
   reconciliador para buscar mensagens do intervalo offline. QR/pairing
   só aparece quando não há pareamento válido (primeira vez ou após
   logout).
6. **Card de saúde do servidor WAHA**: versão (`GET /api/server/version`)
   - aviso de update disponível + badges de `reachoutTimelock`/
     `messageCapping` quando ativos (vem no `GET /me`).

## Envs do app Bosun (já existem, manter)

`WAHA_BASE_URL` (interna, `http://bosun-<env>-waha:3000`),
`WAHA_API_KEY`, `WAHA_WEBHOOK_HMAC_KEY`. Nova: pode ser preciso expor o
hmac key por conexão se quisermos chaves distintas — hoje é global via env
(ok para v1).

## Anti-ban (doc oficial "How to Avoid Blocking")

Regras que afetam o produto, não só ops:

- **Só responder, nunca iniciar** conversa — combina com o produto
  (inbound-first); campanhas/broadcast são risco de ban (já fora do v1).
- **Sequência recomendada ao enviar**: `sendSeen` → `startTyping` → espera
  aleatória proporcional ao tamanho → `stopTyping` → `sendText`. Nosso
  `sendOutboundMessage` manda texto direto — vale o slice fazer o
  envelope seen/typing para parecer humano (custo baixo, ganho real).
- **Reachout Timelock** (erro `463`, `me.reachoutTimelock`,
  `GET /api/sessions/{s}/timelock`): shadow-ban por msg a contatos novos;
  **não reiniciar/re-parear** — levanta sozinho em `timeEnforcementEnds`.
- **Message Capping** (erro `475`, `me.messageCapping`, `GET
/api/sessions/{s}/capping`): quota por ciclo de contatos novos;
  estados `FIRST_WARNING`/`SECOND_WARNING`/`CAPPED`.
- As duas métricas chegam via `GET /me` / `session.status` — bons
  candidatos a badge/aviso na UI de integrações.
- Variação de conteúdo/intervalo só importa para campanhas — fora do
  escopo.

## Resiliência — reboot do container e mensagens perdidas

### Sessão volta sozinha no reboot

- `WAHA_WORKER_RESTART_SESSIONS=True` (default) — WAHA rastreia qual
  worker rodava cada sessão e as religa quando o worker volta.
- `WHATSAPP_RESTART_ALL_SESSIONS=True` — religa também sessões `STOPPED`.
- `WAHA_WORKER_ID` estável + volume `/app/.sessions` persistido =
  pareamento sobrevive a redeploys (não precisa re-escanear QR).

### Mensagens durante downtime — dois lados

**WAHA fora do ar / reiniciando**: a sessão WhatsApp fica offline e o
WhatsApp entrega o acumulado ao reconectar — mas chega como **history
sync** (upsert `append`), não necessariamente como evento `message`
normal. **Precisa de teste real**: confirmar se GOWS emite `message` para
mensagens sincronizadas offline. Se não emitir → backfill via
`GET /api/{session}/chats/{chatId}/messages` (paginado, `?limit=`).

**Decidido — job reconciliador no pg-boss**: ao boot + periódico, para
cada conexão `connected`, listar chats recentes e ingerir mensagens
faltantes — o ingest já deduplica por `externalMessageId`, então backfill
é idempotente e seguro. Cobre os dois lados (WAHA down e Bosun down);
retries do webhook (exponencial, ~21min de janela — ver seção de
retries) continuam como primeira linha para Bosun-down.

### Estado da sessão exposto

`GET /api/sessions/{s}/me` → número pareado + `reachoutTimelock` +
`messageCapping`. O `session.status` (WORKING) re-emite quando esses
campos mudam — dá para manter a UI avisando "conta com restrição" sem
polling.

## App "Phone Numbers: Brazil" (9º dígito)

Decisão do usuário: habilitar. App nativo do WAHA que resolve a
ambiguidade 8↔9 dígitos dos celulares BR no **envio** (tiers: regras
estáticas → cache persistente → contatos locais → lookup no WhatsApp;
`strict:false` manda no melhor chute).

Requisitos de env no container WAHA:

- `WAHA_APPS_ENABLED=True`
- `WAHA_APPS_ON=brazilian-phone-numbers` (só o necessário)
- `WAHA_API_KEY_PLAIN=<plain>` — exigido por alguns Apps (convive com o
  `WAHA_API_KEY` sha512)
- `REDIS_URL` — já setada

Config por sessão (`config.apps[]`, mesma pegada do `webhooks`):

```json
{
  "app": "brazilian-phone-numbers",
  "session": "<session>",
  "id": "app_<session>",
  "config": {
    "strict": false,
    "lookup": true,
    "cache": { "memoryTtl": "24h", "persistent": true, "persistentTtl": "31d" }
  }
}
```

## Version check na UI

`GET /api/server/version` → `{version, engine, tier, browser}`
(`/api/version` deprecated). Para "sempre atualizado": exibir a versão na
página de integrações e, se desejado, comparar com a última release
`devlikeapro/waha` (GitHub API, server-side com cache) → badge "update
disponível". Deploy da atualização = retag `:gows` no Coolify.

## Diff do `.env` antigo de referência (projeto anterior)

O env antigo (app WAHA de outro projeto, engine WEBJS, com FQDN público)
confirma a maior parte da tabela e traz diferenças a considerar:

| Item                            | Env antigo                       | Proposta Bosun                                   | Nota                                                                                                             |
| ------------------------------- | -------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Engine                          | `WEBJS`                          | `GOWS`                                           | Decidido — mais leve/moderno.                                                                                    |
| `WAHA_API_KEY`                  | plain                            | plain + `WAHA_API_KEY_PLAIN`                     | O plain já era usado; pode migrar p/ `sha512:` quando quiser (convivem).                                         |
| Dashboard/Swagger               | enabled + creds                  | dashboard on (sem FQDN), swagger **off em prod** | Staging pode manter swagger.                                                                                     |
| FQDN                            | `waha.fluxie.com.br` público     | **sem FQDN** (rede interna)                      | QR/pairing via nossa UI torna o dashboard externo dispensável.                                                   |
| `WAHA_NAMESPACE`                | `all`                            | `all`                                            | ✅ idem                                                                                                          |
| `WHATSAPP_RESTART_ALL_SESSIONS` | `true`                           | `true`                                           | ✅ idem                                                                                                          |
| `WAHA_AUTO_START_DELAY_SECONDS` | `5`                              | `0`→`5`                                          | WEBJS pede delay maior; com GOWS `0`–`1` basta, mas `5` não custa nada.                                          |
| Media                           | `LOCAL` + `FILES_LIFETIME=86400` | `S3`→RustFS, retenção 7d                         | Decidido.                                                                                                        |
| Apps                            | `chatwoot,calls`                 | `brazilian-phone-numbers`                        | Decidido — só o app do 9º dígito.                                                                                |
| `WAHA_PRESENCE_AUTO_ONLINE`     | `False` + `10s`                  | avaliar                                          | Env antigo desligava auto-online; nosso fluxo seen/typing (anti-ban) pode preferir o default — decisão no build. |
| `WAHA_PRINT_QR`                 | `false`                          | `false`                                          | ✅ QR vem via API, não console.                                                                                  |
| `WAHA_LOG_FORMAT`/`_LEVEL`      | `JSON`/`info`                    | `JSON`/`info`                                    | ✅ idem                                                                                                          |
| `UV_THREADPOOL_SIZE`            | `8`                              | —                                                | Era tuning do WEBJS/Node; GOWS não precisa.                                                                      |
| `TZ`                            | `America/Sao_Paulo`              | `America/Sao_Paulo`                              | ✅ idem                                                                                                          |

## Presença e notificações no celular (pergunta respondida)

A FAQ oficial do WAHA responde exatamente: **"I don't get notifications on
my phone when WAHA session is connected"** → WhatsApp não envia
notificações ao aparelho enquanto um web client está `online`. Ou seja:

- **Decidido**: `WAHA_PRESENCE_AUTO_ONLINE=False` (igual ao env antigo) —
  chamadas de API não marcam a sessão online automaticamente, então o
  celular continua recebendo notificação com som normalmente.
- Regra de uso: depois de qualquer presence que mandarmos (`typing`,
  `recording`, `online`), encerrar com `offline` — a FAQ recomenda
  "send `offline` after all presence you send".
- Separado: `sendSeen` marca a conversa como lida no WhatsApp — aí a
  notificação correspondente é descartada no celular (comportamento
  esperado: agente já leu no Bosun).

## Coreografia de presença/read-receipt (timings)

Como o WhatsApp real se comporta e o que decidimos emular — a sequência
oficial anti-ban do WAHA é `sendSeen → startTyping → espera aleatória ∝
tamanho → stopTyping → sendText`.

### O que o WAHA oferece

- `POST /api/{s}/presence` — `typing`/`recording`/`paused` (por chat),
  `online`/`offline` (global). Typing **persiste até `paused` ou até a
  mensagem chegar** — precisamos limpar explicitamente.
- `POST /api/sendSeen` — marca lido (cliente vê ticks azuis). GOWS aceita
  `messageIds` para marcar mensagens específicas.
- Inbound: `presence.update` (após `POST .../presence/{chatId}/subscribe`)
  entrega `lastKnownPresence` (`typing`/`recording`/`online`/`offline`/
  `paused`) + `lastSeen` → header da conversa mostra "digitando...",
  "gravando áudio...", "visto por último às HH:mm" como no WhatsApp.

### Timings — pesquisa profunda

Como o presence `typing`/`recording` funciona no protocolo (whatsmeow/
GOWS é whatsmeow-based; comportamento igual ao WhatsApp Web):

- **Não é tempo fixo no envio**: o presence `composing` enviado **expira
  ~10s no cliente do destinatário** (fontes da comunidade Baileys: "the
  presence expires after about 10 seconds"; wrappers como Twilio citam
  ~25s na implementação deles). Ou seja: **1 envio ≈ ~10s de "digitando"
  na tela do remoto**.
- **Para segurar mais tempo**: re-enviar o `typing` a cada ~4–5s
  (padrão usado em bots reais — refresh antes de expirar).
- **Limpa sozinho ao enviar a mensagem** — não precisa de `paused` antes
  do send. `paused` só quando desiste/pausa sem enviar.
- **Recording**: mesmo mecanismo (`presence: "recording"`); expira igual
  → refresh enquanto grava, `paused` quando para.

Modelo de duração realista (referências: 50ms/char em exemplos de bot ≈
digitador muito rápido; humano real em celular ≈ 3–5 chars/s):

- `typingMs = clamp(len × msPerChar + jitter±30%, 1s, 12s)` —
  recomendado **~120–150ms/char** (≈7–8 chars/s, digitador rápido de
  celular). Ex.: msg de 80 chars ≈ 10–12s de "digitando". Se passar de
  ~10s, re-enviar o presence até a msg sair.
- `sendSeen` da IA: delay de leitura ∝ tamanho da msg recebida
  (ex.: ~30–80ms/char, clamp 1–8s) + jitter.

### Fluxos decididos

- **Agente humano — sendSeen só ao assumir**: clicar na conversa (modo
  visualização) **não** marca lido — o agente pode ler sem o cliente
  saber. `sendSeen` dispara quando ele **assume o ticket**. Amarra com o
  modelo de tickets: assumir = "li e vou responder".
- **Agente humano — typing no composer**: primeiro keystroke → `typing`
  (refresh ~4s enquanto digita); ~8–10s idle no composer → `paused`;
  volta a digitar → `typing` de novo; enviou → limpa sozinho; fechou/
  descartou → `paused`. Hesitar e retomar reproduz o padrão real.
- **Agente humano — áudio**: MediaRecorder ativo → `recording`
  (refresh); parou → `paused`; **preview obrigatório** (ouvir/regravar/
  descartar) → enviou → `sendVoice` (`convert:true` ou conversão server).
- **Agente de IA — pós-geração**: LLM gera primeiro (remoto não vê nada)
  → `sendSeen` com delay de leitura ∝ msg recebida → `typing` ∝ texto
  gerado (modelo acima, re-enviando se >10s) → `sendText`. Delay total
  natural: geração + leitura + digitação.
- **Auto-reply off-hours**: usa o mesmo envelope (`sendSeen` → `typing`
  ~2–4s ∝ texto fixo → `sendText`) — responder sem marcar lido deixaria
  ticks cinza numa msg já respondida, inconsistente.
- **Offline**: nunca marcar `online` (AUTO_ONLINE=False); presence por
  chat não afeta o celular; `offline` explícito opcional ao fechar
  conversa/sessão de trabalho.

## O que são os `retries` do webhook (pergunta respondida)

Não têm relação com pareamento nem com reconectar sessão. É **WAHA →
Bosun**: quando o WAHA dispara um evento (`message`, `message.ack`, ...)
para `POST /api/webhooks/channels/<token>` e nosso app falha (down, 5xx),
o `retries` define quantas vezes o WAHA re-tenta o POST.

**Decidido**: cobrir janela de **deploy (~5min) e além** — backoff
exponencial/espaçado em vez de constante curto:

```json
"retries": { "policy": "exponential", "delaySeconds": 5, "attempts": 8 }
```

→ tentativas em ~5s, 10s, 20s, 40s, 80s, 160s, 320s, 640s (cobertura
≈ 21min, espaçamento natural). WAHA também tem `policy: linear` —
verificar caps reais na versão deployada e ajustar.

Mesmo com retries longos, **reconciliador continua obrigatório**: retries
cobrem WAHA-ok/Bosun-down; quando o **WAHA** fica down/restarta, o
WhatsApp entrega o backlog como history-sync no reconnect — daí:

- Ao reconectar (sessão volta a `WORKING`), disparar o job reconciliador
  para buscar mensagens recebidas "no meio tempo" — não depender só de
  eventos `message` (que podem não refletir o backlog).
- Botão **"Reconectar"** na UI: `POST .../sessions/{s}/start` (ou
  `restart`) na sessão existente → volta a `WORKING` **sem QR novo**
  (`.sessions` persistido) → reconciliador roda em seguida. QR/pairing
  só aparece se a sessão estiver realmente despareada (LOGOUT/FAILED).

## Features de chat (WhatsApp padrão) ↔ WAHA GOWS

> **Implementado (Brief 2)** — adapter `waha-actions.ts`, ingest em
> `messaging/service.ts`, outbound em `messaging/message-actions.ts` +
> `outbound.ts`, read model em `reads.ts`/`message-views.ts`, UI em
> `apps/web/src/components/{message-item,message-extras,reaction-chips,
composer,voice-recorder,presence-indicator,inbox-live}.tsx`, proxy de
> mídia em `apps/web/src/app/api/media/[id]/route.ts`. Diferenças da
> tabela abaixo: `sendSeen` dispara **ao assumir o ticket** (não ao
> abrir — decisão do usuário); mídia outbound sempre via storage +
> URL assinada (nunca base64); `storageKey` persistido na mensagem para
> re-servir após a URL expirar.

Tudo abaixo é suportado pelo **GOWS** (verificado na tabela de features).
Fora de escopo por decisão: polls, buttons, lists ("sem listas, sem
questionários"), star (não tem no GOWS), forward (não tem no GOWS).

| Feature              | Outbound (Bosun → WAHA)                                                                                                   | Inbound (WAHA → Bosun)                                                                     | Notas                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Texto                | `POST /api/sendText` (`linkPreview`, `reply_to`)                                                                          | `message`                                                                                  | `reply_to` = resposta citada.                                                                      |
| Ticks (cinza/azul)   | `POST /api/sendSeen` (`messageIds` em GOWS) marca lido → cliente vê azul                                                  | `message.ack` já parseado (1 sent / 2 delivered / 3-4 read) → renderizar ticks na mensagem | Enviar `sendSeen` ao abrir a conversa.                                                             |
| Digitando            | `POST /api/{s}/presence` `{chatId, presence:"typing"}` / `"paused"`                                                       | `presence.update` + `POST /api/{s}/presence/{chatId}/subscribe`                            | Agent digitando no composer → WAHA; cliente digitando → "digitando..." na UI.                      |
| Gravando áudio       | mesmo endpoint, `presence:"recording"`                                                                                    | `presence.update` (mesmo evento)                                                           | Composer de áudio dispara enquanto grava.                                                          |
| Áudio (PTT)          | `POST /api/sendVoice` — `audio/ogg; codecs=opus` por URL ou base64; `convert:true` ou `POST /api/{s}/media/convert/voice` | `message` com `hasMedia` + mimetype audio                                                  | MediaRecorder gera webm/opus → enviar com `convert:true` (WAHA converte) ou converter no servidor. |
| Documentos           | `POST /api/sendFile` — URL ou base64, `caption`, `mimetype`, `filename`                                                   | `message` com `media`                                                                      | Upload antes p/ RustFS → URL interna, ou base64 direto.                                            |
| Imagens/vídeo        | `sendImage`/`sendVideo` — adapter já cobre (URL)                                                                          | idem                                                                                       | Preview na UI; inbound via `media.url`.                                                            |
| Reações              | `PUT /api/reaction` `{messageId, reaction:"👍"}` — `""` remove                                                            | `message.reaction`                                                                         | messageId formato `false_<chatId>_<ID>` = nosso `externalMessageId`.                               |
| Editar mensagem      | `PUT /api/{s}/chats/{chatId}/messages/{msgId}` (texto/caption; `@` → `%40`)                                               | `message.edited`                                                                           | Guardar `editedAt`/conteúdo anterior? (decidir modelagem — ver abaixo).                            |
| Apagar mensagem      | `DELETE /api/{s}/chats/{chatId}/messages/{msgId}`                                                                         | `message.revoked`                                                                          | Soft-delete: flag `revokedAt` + "mensagem apagada" na timeline (padrão WhatsApp).                  |
| Online/offline       | `POST /api/{s}/presence` `{presence:"online"/"offline"}` (sem chatId)                                                     | —                                                                                          | Terminar sempre com `offline` (regra das notificações).                                            |
| Número tem WhatsApp? | `GET /api/checkNumberStatus`                                                                                              | —                                                                                          | Útil p/ validar antes de iniciar contato (fora do v1 se não houver fluxo).                         |

### Implicações no domínio Bosun

- `messages`: novos campos `edited_at` timestamptz, `revoked_at`
  timestamptz — **decidido**: conteúdo original é mantido; o que muda é a
  exibição (ver decisões abaixo).
- `message_edits`: tabela de versões (`message_id`, snapshot do conteúdo
  anterior, `edited_at`) — alimenta o "ver edições" (decidido).
- `message_reactions`: tabela própria (`message_id`, `actor` external id,
  `emoji`, timestamps) — reação pode ser do cliente ou do agente.
- `messages.metadata`: `replyTo` (externalMessageId citado), `mediaKind`,
  `mimeType`, `filename`, `duration` (áudio).
- `ChannelProvider`: novos métodos — `sendPresence`, `sendReaction`,
  `editMessage`, `deleteMessage`, `sendSeen`. `sendMessage` já aceita
  media por URL; base64 precisa de extensão.
- Composer: debounce de typing (~2s idle → `paused`); botão de áudio com
  MediaRecorder + `recording` presence; attach de arquivo → upload RustFS.
- Inbound: parse de `message.edited`/`revoked`/`reaction` no adapter +
  eventos de domínio → update na timeline via SSE (já existe o canal).

## Decisões tomadas (usuário, 2026-10-06)

- Engine **GOWS** (mais leve/moderno) — já provisionado.
- **Pairing code habilitado** + QR como fallback.
- **Sem device name custom** — pairing code tem prioridade (o aparelho
  aparece com nome default do WAHA em Aparelhos conectados).
- **Sem grupos** no início (`IGNORE_GROUPS=true`; só conversas 1:1).
- Media: **S3 → RustFS**, retenção **7 dias** (lifecycle do bucket).
- **History sync off** por default (env global, off); importar =
  ajustar env → restart → re-pair.
- Recuperação pós-downtime: **job reconciliador pg-boss** (boot +
  periódico, backfill idempotente por `externalMessageId`).
- `WAHA_PRESENCE_AUTO_ONLINE=False` — celular continua notificando;
  presence sempre encerrada com `offline`.
- WAHA sempre atualizado; `GET /api/server/version` na UI + aviso de
  update.
- App `brazilian-phone-numbers` habilitado (`WAHA_APPS_ENABLED` +
  `WAHA_APPS_ON` + `WAHA_API_KEY_PLAIN`).
- Session name **escolhido pelo usuário** (validado; fallback
  `connection.id`).
- Webhook retries: **`exponential` 5s×8** (~21min — cobre deploys);
  reconciliador dispara também ao reconectar + botão "Reconectar" na UI.
- Features de chat: padrão WhatsApp — texto, mídia, áudio PTT, docs,
  reações, edição/apagar, ticks, typing/recording; sem polls/buttons/
  lists.
- **Mensagem apagada → híbrido por papel**: `revoked_at` + conteúdo
  preservado; agente vê "Esta mensagem foi apagada"; admin/manager pode
  expandir "ver original" (auditoria). Permissão dedicada no matrix.
- **Edição → agente edita + histórico**: composer ganha "editar" nas
  próprias mensagens (janela ~15min do WhatsApp, validar no service e
  tratar erro do WAHA fora da janela); `message_edits` guarda versões
  anteriores e a timeline mostra badge "editada" + "ver edições".
  Edições remotas do cliente seguem o mesmo modelo.

## Ainda em aberto (para o brief)

- Avaliar no teste real se `sendSeen`/`stopTyping` manuais precisam vir
  acompanhados de `offline` (com `AUTO_ONLINE=False` provavelmente não —
  mas validar que o celular segue notificando no cenário real).

Todas as decisões de produto estão tomadas — pronto para o `/brief` do
slice "WAHA go-live + chat features".

## Fontes

- `waha.devlike.pro/docs/how-to/config` — envs (webhooks globais, security,
  files/S3, GOWS device props, namespace, ignore filters)
- `waha.devlike.pro/docs/how-to/sessions` — lifecycle, QR/pairing
  endpoints, `config.webhooks`/`config.client`/`config.apps`, session
  statuses, reachout timelock + message capping
- `waha.devlike.pro/docs/overview/how-to-avoid-blocking` — anti-ban,
  sequência seen/typing/send
- `waha.devlike.pro/docs/apps/phone-numbers-brazil` — app 9º dígito BR
- `waha.devlike.pro/docs/how-to/observability` — `GET /api/server/version`
- `.env` WAHA de projeto anterior do usuário (referência — valores secretos
  não copiados para o doc)
- Context7: WAHA resolvido como `/devlikeapro/waha-docs` (2491 snippets,
  High) — candidato a entrar no mapa pinado de `context7-docs`.
