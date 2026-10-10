# Plan — ai-drafts (sugestão de resposta com aprovação humana)

- **Origem**: `TODO.md` → roadmap IA · `docs/product/ai-agents.md` ("Draft suggestions" + observer modes — este plan cobre **só o módulo ai-drafts**)
- **Lifecycle**: /spec → /plan → /build → /test → /review → /ship
- **Data**: 2026-10-09

## Objetivo

Botões "Sugerir resposta"/"Melhorar resposta" no composer geram (via drafter dedicado) um card de draft no thread da conversa, com ações **Aprovar** (envia), **Editar e enviar** (preenche o composer) e **Rejeitar**.

## Contexto

Decisões do spec/gate (todas fechadas com o usuário):

- Drafter = agente dedicado por org, único gerador de texto; observer decide "quando" (fatia B — fora daqui).
- Draft = row `agent_suggestions` (`target_type='draft'`, `source_conversation_id`, `payload={body}`) — reusa tabela e pipeline de eventos.
- Card próprio no thread (não é private note) — cor/identidade distinta, AI-atribuído.
- Aprovar → `sendOutboundMessage` direto; Editar → prefill composer; Rejeitar → dispensa.
- Permissão: `messaging:write` p/ gerar/aprovar/rejeitar; viewer não vê nada.
- Um draft pendente por conversa — regenerar supersede; inbound novo → `stale` (derivado, badge + regenerar; aprovação ainda permitida).
- `ai_usage_events` por geração (`callKind='draft'`); falha BYOK/provider: toast no manual, skip silencioso no automático.
- Observer modes / nudge cards / onboarding toggle / brain-tools do observer → fatia B (`observer-modes`), fora daqui.

## Decisões de implementação

- **`agents.kind`** (coluna nova, `'org'` default; `'drafter'`/`'observer'` reservados) — identifica o drafter sem convenção frágil de nome/specialty. Serve a fatia B também. Migration própria (RLS já na tabela).
- **Drafter lazy**: criado na 1ª geração (prompt default pt-BR sadio), editável depois pelo form de agent existente (`ai:manage`).
- **`@crm/core/drafts`** módulo novo — `generateDraft` (path job), `approveDraft` (envia via `sendOutboundMessage` + marca reviewed), `rejectDraft`, `listPendingDrafts`. **Sem four-eyes nem `ai:manage`** — contrato diferente das suggestions de config.
- **Geração assíncrona**: server action enfileira job `generate-draft` (pg-boss) → job chama LLM (BYOK + fallback + usage events) → insere suggestion + `emitDomainEvent("agent_suggestion.created")` → SSE já existente atualiza a UI.
- **Stale sem coluna**: `stale = ∃ inbound message.createdAt > draft.createdAt` — computado na página pelo `lastInboundAt` do thread.
- **Editar e enviar**: bridge client-side estilo `lib/reply-bridge` (`draft-bridge`) injeta texto no composer.

## Escopo

```
packages/ai/src/**
packages/db/src/schema/ai.ts
packages/db/migrations/**
packages/core/src/modules/drafts/**
packages/core/src/modules/suggestions/**
packages/core/src/modules/agents/**
packages/core/src/modules/messaging/**
packages/core/src/modules/ai/**
packages/core/src/index.ts
packages/core/package.json
packages/automation/src/**
apps/web/src/components/composer.tsx
apps/web/src/components/draft-*.tsx
apps/web/src/components/inbox-live.tsx
apps/web/src/lib/draft-bridge.ts
apps/web/src/app/app/inbox/**
apps/web/src/server/actions/**
apps/web/src/server/services.ts
apps/web/messages/pt-BR.json
apps/web/e2e/**
.gitignore
```

## Fora de escopo

- `ai_observer_mode` / nudge cards / debounce / onboarding toggle (fatia B)
- Observer migrando pra brain tools (`brain_search`/`memory_propose`)
- UI de settings dedicada pro drafter (usa o agent-form existente)
- RAG/embeddings, spend caps, modo autônomo

## Tarefas

### Fase 1 — schema + core

- **T1** `agents.kind` column + migration (`db:generate`, review SQL, default `'org'`)
- **T2** `@crm/core/drafts`: schemas (payload `{body}`), service `generateDraft`/`approveDraft`/`rejectDraft`/`listPendingDrafts` + repo helpers (pending-for-conversation filtrado `target_type='draft'`, supersede pendente ao regerar); permissão `messaging:write`; approve chama `sendOutboundMessage`
- **T3** geração LLM: resolve drafter (lazy create), credenciais BYOK + fallback, prompt (systemPrompt do drafter + transcript window + brain core org-scope cap 8), parse `{body, rationale}`, `ai_usage_events`
- **T4** int tests do módulo (gera/supersede/stale/approve-envia/rejeita/RLS/viewer negado) + unit dos schemas

### Checkpoint F1

- `pnpm --filter @crm/core test` + int verdes; migration aplicada

### Fase 2 — job + web

- **T5** job `generate-draft` no pg-boss (payload `{conversationId, mode: 'suggest'|'improve', sourceText?}`) + enqueue helper + registro no `boss.ts`
- **T6** server actions (`requestDraftAction`, `approveDraftAction`, `rejectDraftAction`) + service wrappers
- **T7** UI: `DraftCard` no thread (abaixo da lista de msgs, pending only, badge stale + botão regenerar), botões no composer (reply tab), `draft-bridge` p/ prefill, listeners SSE pra refresh; i18n pt-BR
- **T8** e2e: card aparece/aprova/edita/rejeita (draft semeado via service — sem LLM real); unit web se couber

### Checkpoint F2

- `pnpm format && lint && typecheck && test && build` verdes
- Browser check real: card no thread, botões, aprovar envia, editar prefills
- TODO.md/docs atualizados; plan/todo arquivados `.done.md`

## Riscos

| Risco                                                          | Mitigação                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Server action esperando LLM → timeout                          | Job assíncrono + SSE (decisão já tomada)                                                       |
| `approveSuggestion` existente não serve (four-eyes/ai:manage)  | Módulo `drafts` próprio — não tocar o fluxo de config                                          |
| SSE `agent_suggestion.created` não atualiza página da conversa | `inbox-live` já fana o evento — adicionar listener no `[id]` page (`router.refresh` no evento) |
| Approve de draft stale manda texto velho                       | Permitido por spec (julgamento humano) + badge visível                                         |

## Critérios de pronto

- [ ] Botões no composer geram draft (job) → card aparece via SSE
- [ ] Aprovar envia via WAHA path normal (`sendOutboundMessage`)
- [ ] Editar prefills composer; Rejeitar dispensa
- [ ] Viewer não vê botões nem cards; `messaging:write` enforcado no service
- [ ] RLS: draft de org A invisível pra B; `ai_usage_events` gravado por geração
- [ ] Stale badge + regenerar supersede; só 1 pending por conversa
