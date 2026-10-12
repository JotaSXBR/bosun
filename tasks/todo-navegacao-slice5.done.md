# TODO — Slice 5: Inteligência

- [x] **Task 1 — Core**: `proposeKnowledgeEntry` (messaging:write, target
      knowledge_entry, sourceConversationId, emit event) + export;
      `proposeMemoryEntry` restrito a owner/admin/platform_admin
- [x] **Task 2 — Módulo `/app/ai`**: layout (gate ai:read + faixa Resumo +
      tabs), index→reviews, git mv das 3 páginas; vocabulário Revisões/
      Conhecimento/Memória
- [x] **Task 3 — Settings técnico**: tabs → Agentes+Credenciais; index→agents;
      redirects 307; `/agents/[id]` detalhe (4 seções) + `observer` híbrido
- [x] **Task 4 — Ensinar a IA**: action de propor conhecimento; TeachAiDialog;
      entrada na conversa por papel
- [x] **Task 5 — Refs+i18n**: inbox-live→reviews, live-refresh+/app/ai, hub/⌘K
      →agents, settings.ai.tabs + namespace ai.*
- [x] **Task 6 — e2e+gate**: spec de redirects/tabs; gate; visual 4 papéis

## Verificado (Chrome, owner@crm.local)

- `/app/ai` → `/app/ai/reviews`; tabs Revisões/Conhecimento/Memória; faixa
  Resumo com empty state "Nenhuma chave" + link → `/settings/ai/credentials`.
- Redirects legados 307: `settings/ai/suggestions`→reviews, `.../brain`→memory,
  `.../knowledge`→knowledge, `settings/ai`→agents, `.../observer`→agents/observer.
- Settings técnico: 2 tabs (Agentes, Credenciais e uso); lista → "Editar agente"
  → `/agents/[id]` com 4 seções (Identidade/Modelo/Comportamento/Avançado);
  salvar e excluir OK; agente de sistema sem botão Excluir.
- Observador híbrido `/agents/observer`: params de org (modo/intervalos) +
  card "agente ainda não existe" quando ausente.
- Ensinar a IA na conversa → proposta "conhecimento/novo" em Revisões com
  Aprovar/Rejeitar (fluxo end-to-end).
- Papel agent: `/app/ai` → 404 (ai:read); "Ensinar a IA" visível na conversa
  mas Tipo só oferece "Conhecimento" (memória = owner/admin, gate no service).
- Console sem erros; gate: format ✓, typecheck ✓, lint 0 erros (warnings
  baseline), `@crm/web` 9/9, `@crm/core` 46/46.
