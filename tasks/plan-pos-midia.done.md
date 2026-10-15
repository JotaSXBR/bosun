# Plan — pendências pós-mídia: vitest isolate + auto-reply de mídia não suportada

- **Origem**: `TODO.md` → P1 WAHA chat features (pendências) · refine
  pós-review do plano 2 (`metadata.unsupportedMedia` — config por-org)
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-14

## Objetivo

Fechar as pendências reais do ciclo inbox/WAHA: acelerar o runner de
testes (`isolate: false`) e dar à org uma resposta automática editável
para mídia inbound que o canal não conseguiu expor (flag
`metadata.unsupportedMedia` já existe no bubble).

## Contexto

Decisões do gate de esclarecimento (2026-10-14):

- `sendVoice` ogg/opus e `contacts.avatarUrl` **já estão implementados e
  funcionando em staging** (confirmado pelo usuário — `waha-actions.ts`
  força `audio/ogg; codecs=opus` + `convert:true`; pipeline
  `contact-avatar` completo: fetch → storage tenant →
  `/api/contacts/[id]/avatar`). Notas no TODO.md eram defasadas — só
  fechar.
- Auto-reply de mídia não suportada: **template editável por org**
  (coluna `unsupported_media_message text` nullable em
  `organization_settings` — vazio/null = desligado, mesmo padrão de
  `offHoursMessage`), **dedup 1× por ticket** (não responder a cada
  figurinha; seguintes ficam só com a nota interna).
- Sem IA: a resposta é mensagem de sistema enlatada (`authorId` null,
  `metadata.system="unsupported_media"`), enviada pelo job
  `process-channel-event` — provider fora da tx, mesmo padrão do
  off-hours reply (`maybeSendOffHoursReply`).
- `isolate: false` pedido pelo usuário (vitest sugere ~540ms/arquivo
  mais rápido). Se algum teste quebrar por poluição de módulo/estado,
  avaliar custo de corrigir vs reverter — reportar na review.

Decisões do review (2026-10-15, FYIs aprovados para fix):

- Retry pós-falha de auto-reply envia o template **atual**; a marker row
  deve ser atualizada junto (`content` no update de sucesso) — corrige
  em `unsupported-media.ts` E `offhours.ts` (mesmo padrão).
- Precedência por inbound: se `maybeSendOffHoursReply` enviou nesse
  evento, o reply de mídia não sai (1 bolha de sistema por inbound).
- `isolate:false`/`fsModuleCache` também nos pacotes: CI roda
  `turbo run test` → `vitest run` sem config por pacote. Fonte única
  `vitest.unit.shared.ts` na raiz + stub `vitest.config.ts` por pacote
  que só re-exporta.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

vitest.config.ts
vitest.unit.shared.ts
packages/*/vitest.config.ts
apps/web/vitest.config.ts
design-system/vitest.config.ts
tooling/eslint/**
packages/db/src/schema/**
packages/db/migrations/**
packages/core/src/modules/messaging/**
packages/core/src/modules/organizations/**
packages/automation/src/**
apps/web/src/app/app/settings/**
apps/web/src/server/actions/**
apps/web/messages/**

## Fora de escopo

- Copiar mídia inbound pro tenant storage — **decidido não fazer**
  (mídia fica no WAHA S3, lifetime 7d aceito).
- LocalDateTime client-side fora do inbox — resolvido via `TZ` env no
  Coolify; multi-fuso só se virar requisito.
- E4 "não virou negócio" e demais itens do inbox-ui-review — plano 4.
- Auto-resposta com IA de verdade — não existe responder; aqui é texto
  enlatado de sistema.
- `sendVoice`/avatarUrl — já entregues; nada a codar.
- Placeholders no template (`{proximo_atendimento}` etc.) — texto plano.

## Tarefas

1. **vitest `isolate: false`** em `vitest.config.ts` — verify:
   `pnpm test` verde (28 arquivos, sem poluição entre arquivos).
2. **Migration**: coluna `unsupported_media_message text` (nullable) em
   `organization_settings` → `pnpm db:generate` + revisar SQL.
3. **Core organizations**: `unsupportedMediaMessage` em
   `updateOrgSettingsInput`/`upsertSettings` + leitura no settings
   service — verify: `pnpm --filter @crm/core test`.
4. **Core messaging**: `maybeSendUnsupportedMediaReply` — lê settings
   da org, checa `metadata.unsupportedMedia` na mensagem ingerida,
   dedup por ticket (`exists` message com `metadata.system =
'unsupported_media'` na conversa), send via provider + insert da
   mensagem de sistema outbound — unit + int test (dedup, flag off,
   template vazio).
5. **Automation**: invocar o novo `maybe*` no `process-channel-event`
   quando o ingest devolveu mensagem com flag — verify: typecheck +
   `pnpm --filter @crm/automation test`.
6. **UI settings**: textarea `unsupportedMediaMessage` na página de
   service/hours (bloco de respostas automáticas, junto de
   `offHoursMessage`) + i18n pt-BR — verify: typecheck + lint.
7. **Docs**: TODO.md — fechar notas defasadas (sendVoice ogg ✅,
   avatarUrl ✅ staging) + registrar a entrega — verify: `pnpm verify` +
   `pnpm test:integration` + `pnpm build` (toca DB).
8. **Marker content no retry** (review FYI): update de sucesso em
   `deliverReply` grava `content` com o texto corrente — offhours +
   unsupported-media — verify: int tests verdes.
9. **Precedência off-hours** (review FYI): `process-channel-event` só
   chama `maybeSendUnsupportedMediaReply` quando `offHours.sent` é
   false — verify: typecheck + int tests.
10. **Vitest nos pacotes** (review FYI): `vitest.unit.shared.ts` na raiz
    - `vitest.config.ts` stub por pacote com `test` script — verify:
      `pnpm turbo run test` verde.

## Critérios de pronto

- [ ] `pnpm verify` verde
- [ ] Testes alvo: `*.test.ts`/`*.int.test.ts` de messaging +
      organizations; `pnpm test` sem poluição com `isolate:false`
- [ ] `pnpm test:integration` + `pnpm build` verdes (DB touched)
- [ ] Migration gerada e revisada (`0032_*`)
- [ ] Docs atualizadas: `TODO.md`
- [ ] `TODO.md` movido para Concluído
