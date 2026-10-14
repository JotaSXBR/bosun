# Pesquisa omnichannel + revisão do canal WAHA

Estudo encomendado em 2026-10-13 para informar o próximo plano (E2 — ficha
de contato, E3 — power-ups do composer, revisão do WAHA). Duas partes:

1. **Padrões de mercado** — o que produtos de atendimento omnichannel
   consideram baseline (HelenaCRM, Sellio, Synthor, fazer.ai agents,
   Chatwoot e padrões transversais).
2. **Revisão WAHA** — diagnóstico dos bugs reportados ("áudio e envio de
   arquivos não funcionam") + falhas de produto do canal WhatsApp hoje.

## 1. Padrões de mercado omnichannel

Baseline que se repete em todos os produtos sérios:

| Padrão                     | Descrição                                                              | Bosun hoje                                                             |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Thread única por cliente   | Conversas de canais diferentes do mesmo contato numa linha do tempo só | Parcial — tickets por conversa; sem timeline agregada por contato      |
| Filas + atribuição         | Fila compartilhada, assumir/transferir, visões por status              | ✅ Entregue (Fila/Minhas/Adiados/Fechadas, setores)                    |
| Distribuição automática    | Round-robin/least-busy ao entrar na fila                               | ❌ Decisão registrada: manual; roteamento via intake quando IA atender |
| Notas internas             | Mensagem privada inline no thread                                      | ✅ `addInternalNote`                                                   |
| Macros / respostas rápidas | Respostas prontas via `/` ou atalho                                    | ❌ E3 previsto                                                         |
| Regras por canal           | Janela 24h WhatsApp + templates HSM fora dela                          | ⚠️ WAHA (não-oficial) não tem janela; Meta Cloud vai precisar          |
| Presença                   | typing/recording/seen dos dois lados                                   | ✅ Implementado (seen ao assumir, typing no composer)                  |
| Mídia completa             | imagem/vídeo/áudio PTT/documento in e out                              | ⚠️ Implementado, mas **quebrado em staging** (ver §3)                  |
| Tags/etiquetas             | Por conversa e contato                                                 | ✅ `labels` entregue com leads                                         |
| Funil dentro da conversa   | Criar/mover deal sem sair do thread                                    | ✅ aside + kanban                                                      |
| Contadores de não-lido     | Badge de não-lidas por conversa/usuário                                | ❌ Non-goal registrado (cursores por usuário)                          |
| SLA                        | Tempo de 1ª resposta / resolução com alvos e alerta                    | ⚠️ `first_response_at` existe; sem alvo/alerta                         |
| CSAT                       | Pesquisa de satisfação ao resolver                                     | ❌                                                                     |
| IA no atendimento          | Rascunhos, resumo, resposta autônoma com handoff                       | ✅ Observer/drafter/brain entregues (modo humano-in-the-loop)          |
| STT de áudio inbound       | Transcrever áudio do cliente p/ texto no thread                        | ❌                                                                     |
| Foto de perfil do WhatsApp | Avatar do contato puxado do canal                                      | ❌ coluna existe (`avatarUrl`), nunca preenchida                       |
| Handoff IA→humano          | Bot encerra com resumo privado e roteia                                | ⚠️ Observer não atende; intake `pending` previsto, não implementado    |
| Debounce de rajadas        | IA agrupa mensagens picadas antes de responder                         | ❌ Relevante quando IA atender                                         |
| Chat interno entre agentes | Canal de time dentro do atendimento                                    | ❌ Notas internas cobrem o essencial                                   |

### Referências analisadas

**HelenaCRM** (helenacrm.com) — CRM WhatsApp-first brasileiro:
filas com distribuição automática entre equipes/operadores, canais Meta
(WA/IG/Messenger), card de CRM criado **dentro da conversa**, funil por
etapa da jornada, chatbot builder + **múltiplos agentes IA orquestrados na
mesma conversa** (qualifica, responde, resume, consulta MCP), carteirização
de clientes, chat interno, app mobile. Padrão que nos falta: criar deal/
atualizar ficha como ação inline do thread (temos "Virar lead"; eles vão
além — edição do card sem sair da conversa, que é o E2).

**Sellio** (selliocrm.com) — CRM com help desk embutido: painel
"Conversas" = timeline unificada por pessoa (WhatsApp, SMS, chat, e-mail,
ligações, reuniões, notas) **agrupada por dia com resumo de IA por dia**
(destaques + próximo passo). Central de tickets com visões salvas e
relógios de SLA no painel lateral. Inspirar: timeline omnicanal por
contato (E2+) e resumo-IA por período.

**Synthor** (synthor.cloud) — CRM omnichannel com agente de IA central:
toda conversa **vira lead automaticamente** no pipeline, scoring por
comportamento, follow-ups automáticos por etapa do kanban, chat do site
com **modo voz (PTT)** e migração site→WhatsApp sem perder contexto, "CRM
dentro do Claude" via MCP. Inspiração direta para E4 ("não virou negócio"
— já referência no spec) e para a ideia de canal-to-channel handoff.

**fazer.ai agents** (fazer.ai) — agentes IA sobre Chatwoot (fork próprio):
STT de áudio (Whisper/Gemini/ElevenLabs), **resposta em voz com
preferência por contato**, leitura de imagens/documentos, **debounce de
rajadas**, toolpacks (Asaas PIX, Google Calendar/Drive), MCPs externos,
base de conhecimento com fila de aprovação, handoff IA→humano com resumo
privado, **redirecionamento de canal** (WA oficial → chat do site p/
economia de mensagem), importação de histórico do celular ao conectar,
foto de perfil puxada do WhatsApp, bots observadores. Nosso observer +
brain + approval queue cobre o mesmo conceito de IA supervisionada; ficam
descobertos: STT/TTS, debounce, handoff real de atendimento.

**Chatwoot/respond.io/transversal**: janela 24h + templates, cursores de
não-lido, visões salvas por equipe, SLA com alertas, CSAT, relatórios por
agente/canal — esperados quando formos multi-canal de verdade (Meta Cloud,
e-mail).

## 2. Revisão de produto — canal WAHA

### O que existe (verificado no código)

- Ciclo de vida de sessão: create/start/stop/restart/logout, QR +
  pairing code, webhook por sessão com HMAC + retries exponenciais,
  reconciliador pg-boss (backfill), health card, `/me` com warnings
  timelock/capping, app brazilian-phone-numbers previsto.
- Chat: texto c/ `reply_to`+`linkPreview`, imagem/vídeo/documento/áudio
  via URL, PTT via `sendVoice`+`convert:true`, reações, edição (15min),
  apagar (híbrido por papel), ticks (ack), presence typing/recording +
  subscribe, `sendSeen` ao assumir, proxy autenticado `/api/media/[id]`.

### Falhas de produto encontradas

1. **Sem spec de produto do canal** — as features saíram de briefs de
   implementação (`tasks/briefs`); `docs/product/` não define o
   comportamento esperado do WhatsApp (o que este documento cobre em
   parte). Ex.: retenção de mídia, semântica de acks, comportamento com
   `@lid`, política de import de histórico — decisões dispersas.
2. **Mídia inbound morre em 7 dias** — staging roda mídia local no WAHA
   (`WHATSAPP_FILES_LIFETIME=7d`); a decisão S3→RustFS **não foi aplicada**
   (envs `WAHA_MEDIA_STORAGE`/`WAHA_S3_*` ausentes no container staging —
   verificado via Coolify MCP, 2026-10-13). Após 7d o player/download dá 404. Sem S3 também não há sobrevivência a perda de volume.
   - **Armadilha conhecida**: se ativar `WAHA_S3_PROXY_FILES=False`, o
     `media.url` vira URL assinada do RustFS e o `wahaFetchMedia` a
     **rejeita** pelo guard SSRF (origem ≠ host WAHA) — mídia inbound
     quebra 100%. Opções: manter `PROXY_FILES=True` (URL segue no host
     WAHA) ou permitir a origem do storage no guard.
3. **App `brazilian-phone-numbers` provavelmente inativo em staging** —
   `WAHA_APPS_ON` está setada, mas `WAHA_APPS_ENABLED` e
   `WAHA_API_KEY_PLAIN` (exigidos pelo app) **não existem** no container.
   Sem ele, o envio para números com ambiguidade 8↔9 dígitos usa o id bruto.
4. **Avatar do contato nunca populado** — `contacts.avatarUrl` existe no
   schema mas nada escreve nele. Mercado (fork Chatwoot da fazer.ai) puxa
   a foto do WhatsApp; WAHA expõe `GET /api/contacts/profile-picture`.
5. **Sem transcrição de áudio inbound** — áudio do cliente é conteúdo
   morto para o observer/drafter (transcript usa texto) e exige play
   manual. Padrão de mercado: STT automático (fazer.ai, Helena).
6. **Envelope anti-ban incompleto no envio humano** — a sequência
   documentada `sendSeen → typing ∝ texto → send` não é aplicada no send
   (typing só enquanto digita; `sendSeen` só ao assumir). Risco real
   quando começarmos outbound-first em volume.
7. **Contatos `@lid`** — identidade válida no parser, mas outbound para
   `@lid` depende do app de 9º dígito (ver #3) e pode precisar de
   resolução PN→LID; não há spec do comportamento. Verificar em teste real.
8. **`presence.update`/acks observados ao vivo** e demais pendências já
   listadas no TODO (backfill reconcile, `channel_event` audit c/ RLS).
9. **`WAHA_PRESENCE_AUTO_ONLINE=False`** decidido; o adapter não expõe
   `online`/`offline` globais — encerramento `offline` após presences é
   recomendação da doc WAHA ainda não implementada (menor).

## 3. Diagnóstico técnico — "áudio não funciona / envio de arquivos não funciona"

### Reprodução por código + evidência de staging

Fluxo outbound (composer → `sendMediaMessageAction` → RustFS `upload` →
`getSignedUrl` → `sendChannelMessage` → `wahaSendMessage` com `file.url`):

- **Log do bosun-staging (2026-10-13, via Coolify MCP)**: exceção S3
  capturada em `action:"chat"` — stack passa por
  `S3RestXmlProtocol.deserializeResponse`, ou seja, o **RustFS respondeu
  erro (não-2xx) ao `PutObject`** do upload. O envio morre antes de
  chamar o WAHA → toast "Não foi possível enviar o arquivo."
- **Local verificado funcionando** (RustFS `rustfs/rustfs:1.0.0`, mesmo
  SDK): `HeadBucket`/`PutObject`/presigned GET → 200. Ou seja, o código
  está correto; o problema é o ambiente de staging.
- **Hipótese primária**: o bucket `crm` **nunca foi criado no RustFS de
  staging** — `pnpm storage:init` é script local e o `entrypoint.sh` do
  app só roda migrations. Hipóteses secundárias: credenciais
  `STORAGE_S3_*` divergentes de `RUSTFS_ACCESS_KEY`/`RUSTFS_SECRET_KEY`
  (valores não são legíveis via MCP), ou incompatibilidade de checksum
  (SDK manda `x-amz-checksum-*`; RustFS 1.0.0 aceitou localmente, então
  improvável).
- **Verificação barata**: `HeadBucket`/`CreateBucket` contra o endpoint
  de staging, ou rodar `pnpm storage:init` com as envs de staging. Se o
  upload passar a funcionar, falta apenas garantir que o WAHA alcança o
  `STORAGE_S3_ENDPOINT` (mesma rede Docker no projeto → ok se o endpoint
  for `http://bosun-staging-rustfs:9000`).

### Áudio (PTT) especificamente

- O caminho é o mesmo do upload — `voiceNote:true` → `mediaKind:"audio"`
  → `sendVoice` com `convert:true`. **O bug do upload explica áudio
  quebrado também.**
- GOWS **suporta** `sendVoice` e `convert` (confirmado na referência da
  API GOWS — `convert` usa ffmpeg dentro do WAHA).
- Ressalva menor: enviamos `file.mimetype` como `audio/webm;codecs=opus`
  (mimetype real do MediaRecorder). Com `convert:true` o WAHA transcodifica;
  se algum build do GOWS exigir `audio/ogg; codecs=opus` no campo mimetype,
  basta forçar esse valor no adapter quando `voiceNote` — decidir no fix.
- **Inbound** de áudio deve funcionar enquanto o arquivo viver no WAHA
  (7d) — se o usuário viu áudio inbound quebrado **antes** dos 7 dias,
  investigar `resolveMessageMedia`/`fetchMedia` no thread; a hipótese mais
  provável continua sendo que nunca se viu funcionando porque **outbound
  estava quebrado** (o teste típico é enviar áudio).

### Resumo da causa

| Sintoma                                      | Causa                                                    | Confiança           |
| -------------------------------------------- | -------------------------------------------------------- | ------------------- |
| Envio de arquivo falha                       | Upload S3 no staging rejeitado (bucket ausente ou creds) | Alta (log)          |
| Envio de áudio falha                         | Mesmo caminho de upload                                  | Alta                |
| Áudio/arquivo inbound antigo falha           | Mídia expira no WAHA em 7d (sem S3)                      | Alta (envs)         |
| Mídia inbound sempre quebrada (se S3 ligado) | `PROXY_FILES=False` × guard SSRF do fetchMedia           | Média (condicional) |

## 4. Recomendações priorizadas

Ordem sugerida para o(s) próximo(s) plano(s) — do destrava agora ao
estrutural:

1. **Destrava staging (ops, ~minutos)**: criar bucket no RustFS staging
   (rodar `storage:init` apontando para as envs de staging ou via
   console); conferir `STORAGE_S3_ACCESS_*` × `RUSTFS_*`; testar envio de
   arquivo/áudio. Sem isso, E3/mídia não têm como ser verificados.
2. **Fix pequeno (código)**: suportar também **base64** como fallback no
   adapter WAHA quando a URL não for alcançável, ou — melhor — validar no
   `sendMediaMessageAction` que o endpoint de storage é interno e documentar
   o requisito ("o host do `STORAGE_S3_ENDPOINT` precisa resolver dentro da
   rede do WAHA"). Mimetype `audio/ogg; codecs=opus` no sendVoice.
3. **Decisão de produto WAHA (spec)**: escrever `docs/product/channel-whatsapp.md`
   cobrindo retenção de mídia (aplicar S3 ou aceitar 7d + sweeper),
   `PROXY_FILES`, apps (completar envs do brazilian-phone-numbers),
   avatar pull, STT de áudio inbound, envelope anti-ban no send, `@lid`.
4. **E2 informado pelo mercado**: ficha de contato com timeline unificada
   multi-canal (Sellio), card/deal inline (Helena), avatar do WhatsApp,
   tags — supera o spec atual que é "cadastro estilo Google People".
5. **E3 informado**: macros `/` continuam certos (universal); adicionar à
   consideração indicadores de não-lido e power-ups de áudio (ouvir STT).
6. **Médio prazo (mercado)**: distribuição automática ao entrar na fila
   (Helena/Sellio — repensar a decisão de manual-only quando houver
   intake de IA), SLA targets, CSAT, resumo-IA por período no thread.

## Fontes

- helenacrm.com (/, /sistema-multifuncoes-para-whatsapp,
  /crm-integrado-com-whatsapp, /chatbot-de-atendimento), docs.helena.app
- selliocrm.com/features + /pt/help-center; selliq.com.br (namesake —
  automação de achadinhos, provavelmente não era a referência)
- synthor.cloud, synthor.io/plataforma/{crm-omnichannel,chat-embed}
- fazer.ai/en/agents, github.com/fazer-ai/{agents,chatwoot} (READMEs),
  fazer.ai/blog/*
- waha.devlike.pro (send-messages, media-voice-convert/format),
  gowapi.readme.io (GOWS sendVoice `convert`)
- Evidências internas: logs bosun-staging + env keys via Coolify MCP
  (2026-10-13), `docker/compose.yml`, `docker/web/entrypoint.sh`,
  `docs/development/waha-setup.md`, código em `packages/channels`,
  `packages/core/messaging`, `apps/web/src/server/actions/chat.ts`,
  teste local PUT/presign contra RustFS 1.0.0 (passou).
