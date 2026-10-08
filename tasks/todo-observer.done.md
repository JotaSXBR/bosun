# Tasks — IA observer (v1)

## Task 1: Schema + permissions

**Description:** `packages/db/src/schema/ai.ts` com 5 tabelas tenant-owned
(`org_llm_credentials`, `agents`, `knowledge_entries`, `agent_suggestions`,
`ai_usage_events`) — org_id + pgPolicy + enableRLS + grants na migration.
`@crm/permissions`: resource `ai: ["read","manage"]` (owner/admin/manager
manage, viewer read).

**Acceptance criteria:**

- [x] Migration aplicada; RLS prova isolamento cross-org (int test)
- [x] `pnpm typecheck` verde

## Task 2: `@crm/ai` openrouter

**Description:** `@openrouter/ai-sdk-provider@3.1.0` no package.json;
`ModelRef.provider` += `"openrouter"`; `AiProviderKeys` +=
`openrouterApiKey`; case em `resolveLanguageModel` (extraBody `provider.zdr`).

**Acceptance criteria:**

- [x] `resolveLanguageModel({provider:"openrouter"}, {openrouterApiKey})`
      retorna LanguageModel; sem key → `AiProviderNotConfiguredError`

## Task 3: `@crm/core/ai` — BYOK + usage

**Description:** `modules/ai` (index/service/repository/schemas):
credenciais CRUD com `encryptJson`; `resolveOrgLlm(ctx)` ordena por
priority; `callOrgLlm(ctx, input)` tenta a cadeia (falha → próximo) e
grava `ai_usage_events` por tentativa.

**Acceptance criteria:**

- [x] Int test: fallback pula credencial quebrada; usage gravado; key
      nunca retorna em list

## Task 4: `@crm/core` agents + knowledge

**Description:** `modules/agents` + `modules/knowledge` — CRUD service/
repo/schemas, permissões `ai:read/manage`, audit em create/delete.

**Acceptance criteria:**

- [x] Int test: CRUD + isolamento + permissão negada p/ agent role

## Task 5: suggestions + observer

**Description:** `modules/suggestions` (list/approve/reject — approve
aplica diff ao agent ou cria/atualiza knowledge, tx + emitDomainEvent);
`modules/ai/observer.ts` (transcript + agents + knowledge →
`generateObject` zod → pending suggestions).

**Acceptance criteria:**

- [x] Int test: approve agent-suggestion atualiza o agente; approve
      knowledge-suggestion cria entry; observer com fake model emite
      sugestões pending

## Task 6: automation job

**Description:** `tasks/observe-conversation.ts` + enqueue; hook no
resolve de conversa; `observeOrg` manual; registro boss.ts.

**Acceptance criteria:**

- [x] Resolver conversa enfileira observer; botão manual enfileira org;
      sem boss → skipped

## Task 7: UI `/app/settings/ai`

**Description:** página com credenciais, agents CRUD, knowledge,
suggestions inbox (approve/reject + rationale), botão analisar. Actions

- `pt-BR.json` keys + SSE toast em `agent_suggestion.created`.

**Acceptance criteria:**

- [x] Zero literal PT em JSX novo; página renderiza com dados seed

## Task 8: e2e + docs + gate

**Description:** spec e2e (credencial → sugestão seed → approve/reject;
analisar sem credencial → toast). TODO.md entregue; domain-model.md.

**Acceptance criteria:**

- [x] Gate completo verde + CI
