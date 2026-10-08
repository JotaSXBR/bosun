# Plano — IA observer (v1)

Spec: `docs/product/ai-agents.md` · Brief: `.task-brief.md`

## Arquitetura decidida

```
conversa resolved ─┐
                   ├→ pg-boss observe-conversation → @crm/core/ai.observer
botão "analisar" ──┘        │
                            ├─ resolveOrgLlm(ctx) → credenciais por prioridade
                            ├─ transcript + agents + knowledge → prompt
                            ├─ generateObject (zod) via LanguageModel
                            ├─ insert agent_suggestions (pending)
                            ├─ insert ai_usage_events
                            └─ emitDomainEvent(agent_suggestion.created) → SSE
```

- **BYOK**: `org_llm_credentials` (provider `openai`/`anthropic`/`openrouter`,
  key AES-256-GCM via `encryptJson`, `model` texto livre ex.
  `openai/gpt-5-mini`, `priority`, `zdr` bool → routing OpenRouter).
- **Resolver**: anda a cadeia por prioridade; falha de provider → próxima
  credencial; sem credencial → observer off silencioso (log only).
- **Sugestões**: `agent_suggestions.target_type` ∈ `agent`/`knowledge`;
  `payload` = diff jsonb; approve aplica (agent update / knowledge
  create-update); reject marca status. Rationale sempre visível.
- **Observer brain** = modelo da credencial de maior prioridade
  (`agents.model_ref` é config para v2 — sugestões podem propor mudá-lo).

## Fatias

### T1 — schema + permissions

- `packages/db/src/schema/ai.ts`: `org_llm_credentials`, `agents`,
  `knowledge_entries`, `agent_suggestions`, `ai_usage_events` — todas
  tenant-owned (org_id + pgPolicy + enableRLS + grants migration).
- `@crm/permissions`: `ai: ["read","manage"]` — owner/admin/manager
  manage, viewer read, agent sem acesso.
- `pnpm db:generate` → revisar SQL → `db:migrate`. Int test RLS ×5.

### T2 — `@crm/ai` openrouter

- Dep `@openrouter/ai-sdk-provider@3.1.0`; `ModelRef.provider` +=
  `"openrouter"`; `AiProviderKeys` += `openrouterApiKey`;
  `resolveLanguageModel` case openrouter (extraBody com `provider.zdr`
  quando pedido).

### T3 — `@crm/core/ai` (BYOK + usage)

- Módulo `modules/ai`: credenciais CRUD (encrypt/decrypt, sem ecoar key),
  `resolveOrgLlm(ctx)` → cadeia ordenada → `callOrgLlm(ctx, fn)` que tenta
  por prioridade + grava `ai_usage_events` (tokens, latency, model, kind).

### T4 — `@crm/core` agents + knowledge

- `modules/agents` + `modules/knowledge`: service/repo/schemas zod,
  permissões `ai:*`, audit em create/delete.

### T5 — suggestions + observer

- `modules/suggestions`: list/create/approve/reject; approve aplica diff
  no target (agent update ou knowledge create/update) na mesma tx +
  `emitDomainEvent`.
- `modules/ai/observer.ts`: prompt observer (transcript + agentes +
  knowledge) → `generateObject` schema zod (suggestions[]) → insert.
  Model injetável p/ testes (fake LanguageModel).

### T6 — automation

- `tasks/observe-conversation.ts` + enqueue helper; hook no resolve de
  conversa (messaging lifecycle); `observe-org` p/ botão manual; registro
  em `boss.ts`; enqueue no-op sem boss.

### T7 — UI `/app/settings/ai`

- Credenciais (form provider/key/model/priority/zdr), agents CRUD,
  knowledge CRUD, inbox de sugestões (approve/reject + rationale + diff),
  botão "Analisar agora". Server actions + strings direto em `pt-BR.json`.
  Toast via SSE em `agent_suggestion.created` (inbox-live já assina).

### T8 — e2e + docs + gate

- Spec e2e: settings → salvar credencial (fake) → sugestão seedada via
  service → inbox approve/reject; botão analisar sem credencial → toast
  "não configurado". Docs: TODO.md, domain-model.md.

## Fora (brief)

Drafts in-conversation, autônomo, triage, TTS, proativo, RAG, spend caps.
