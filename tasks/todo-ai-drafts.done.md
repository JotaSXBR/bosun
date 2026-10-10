# Tasks — ai-drafts

- [x] **T1** `agents.kind` coluna + migration (default `'org'`; drafter/observer reservados)
  - Done: migration `0019_safe_vengeance.sql` aplicada; `findAgentByKind` no repo
- [x] **T2** `@crm/core/drafts` módulo (service+repo+schemas; permissão `messaging:write`; supersede on regenerate; approve→`sendOutboundMessage`)
  - Done: drafts insertam direto na tabela via repo (bypass do enum fechado `suggestionTargetSchema`); settings inbox filtra só targets de config (whitelist); `approveSuggestion`/`rejectSuggestion` genéricos guardam contra targets conversation-scoped; approve fora do tx + `deps.provider` injetável
- [x] **T3** geração LLM — `packages/ai/src/drafter.ts` `draftReply()` puro (systemPrompt+rules+transcript+brain core≤8, `generateObject` `{body,rationale}`); drafter lazy `kind='drafter'`; `callKind='draft'` usage
  - Files reais: `packages/ai/src/drafter.ts` (espelha observer.ts), `findOrCreateDrafter` no drafts service
- [x] **T4** int tests — `drafts/service.int.test.ts` 6/6 ✅ (cria/supersede/aprova-envia/rejeita/RLS/viewer/isolamento inbox); `suggestions` regression ✅
- **Checkpoint F1**: ✅ core+automation typecheck verde, migration aplicada
- [x] **T5** job `generate-draft` pg-boss + `enqueueGenerateDraft` + registro `boss.ts` — `generate-draft.int.test.ts` 3/3 ✅ (skip sem credencial; persist+usage+drafter lazy; regen supersede)
  - Extra: observer dedupe agora ignora `targetType='draft'` (draft pendente não bloqueia análise pós-resolve)
- [x] **T6** server actions `actions/drafts.ts` (`requestDraft`→enqueue com `messaging:write`, `approveDraft`, `rejectDraft`) + `services.listConversationDrafts`
- [x] **T7** UI — `DraftCard` (approve→send / edit→composer via draft-bridge / reject; stale badge), composer buttons (reply tab, improve pede texto), página renderiza drafts + stale derivado, `inbox-live` toast draft-aware (sem link pro settings), i18n pt-BR
- [x] **T8** verificação — e2e specs não tocam DB → coberto por int tests + browser check real (abaixo)
- [x] **/test browser** (chrome-devtools MCP, draft semeado via `createDraftSuggestion` + `sendWidgetMessage`, sem LLM):
      card renderiza (título/body/rationale/3 ações) ✅ · Editar→composer preenchido+focado ✅ · "Aprovar e enviar"→toast "Resposta enviada"+outbound no thread+SSE live ✅ · badge stale "Cliente respondeu depois" (inbound mais nova) ✅ · "Descartar"→card removido ✅ · "Sugerir resposta"→toast "Gerando sugestão…", job skip limpo sem credencial ✅ · console 0 erros ✅
- [x] **/review fixes** (aplicados no diff não-commitado):
  - `listRecentMessages` (tail window) p/ transcript do drafter+observer — antes os jobs viam as 40/100 mensagens MAIS ANTIGAS; int test de ordering (45 msgs→últimas 40) ✅
  - staleness via `getLastInboundAt` (agregado MAX, imune ao window da página) em `message-views.ts`
  - caps alinhados 4096 ponta-a-ponta (drafter output + draft payload + sourceText = `sendOutboundInput.text`)
  - action `requestDraft` faz precheck `hasOrgLlmCredentials` → erro manual "sem credencial" (gap do T7 fechado); job continua skip silencioso
  - `insertAgentOnce` + unique parcial `agents(organization_id,kind) WHERE kind<>'org'` (migration `0020_odd_stature.sql`) → `findOrCreateDrafter` race-safe
  - `proposedBy` ligado (auditoria do solicitante) · `record("ok")` best-effort (draft pago não é perdido se usage event falha)
  - `packages/automation/src/llm-keys.ts` — `keysFor` compartilhado (dedupe generate-draft↔observer); observer usa `DRAFT_TARGET_TYPE`
  - `'superseded'` adicionado a `suggestionStatusSchema` · observer int test: draft pendente não bloqueia análise ✅
  - web: drafts só renderizam em thread trabalhável (`canWork`), `payload` via `draftPayloadSchema.safeParse`, `.catch` com `captureException`, `useDraftFill` latest-ref via effect
  - `apps/web/next-env.d.ts` revertido (drift de dev server)
- **Checkpoint F3** (pós-review): format ✅ · typecheck 14/14 ✅ · lint 0 erros ✅ · unit 167/167 ✅ · int 236/236 ✅ — pronto pra commit/ship (archive pendente)
