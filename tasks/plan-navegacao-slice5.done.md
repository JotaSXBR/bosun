# Plan — Slice 5: Inteligência (módulo /app/ai + técnico em settings + Ensinar a IA)

## Objetivo

Criar o módulo **Inteligência** (`ia-navegacao.md` §3): `/app/ai` com faixa
Resumo + Revisões/Conhecimento/Memória (moves de `settings/ai/*`), e a seção
técnica em `/app/settings/ai` reduzida a Agentes (com detalhe `/agents/<id>` +
observador híbrido) e Credenciais. Implementar "Ensinar a IA" na conversa
(§7.3) e alinhar permissões de propor (§7.4).

## Decisões registradas

- "Ensinar a IA" **entra no slice** (aprovado): service `proposeKnowledgeEntry`
  novo no core (`messaging:write`, spec §7.4) + action + entrada na conversa.
- Detalhe de agente **completo**: `/app/settings/ai/agents/[id]` com as 4
  seções; `id="observer"` resolve o agente de sistema e soma os parâmetros
  (modo/intervalo/idle/autoDraft — `ObserverSection`).
- Resumo = **faixa no layout** do módulo (todas as páginas `/app/ai/*`).
- `?view=history` em Revisões + filtro por tipo já existentes na seção — verificar e reaproveitar.
- Propor memória: spec §7.4 diz owner/admin — `proposeMemoryEntry` hoje exige
  `ai:manage` (inclui manager) → **restringir** a owner|admin|platform_admin
  (service + UI).

## Critérios de pronto

- [ ] `/app/ai` (ai:read): layout com faixa Resumo (chave ativa · modo do
      observador · última proposta · pendências; sem chave → estado vazio com
      link pra Credenciais) + tabs Revisões/Conhecimento/Memória; index →
      `/app/ai/reviews`.
- [ ] `/app/ai/reviews` (move suggestions), `/app/ai/knowledge`,
      `/app/ai/memory` (move brain) — mesmas seções, vocabulário novo.
- [ ] `/app/settings/ai` → redirect `/app/settings/ai/agents`; tabs só
      Agentes + Credenciais e uso.
- [ ] `/app/settings/ai/agents/[id]`: detalhe com Identidade · Comportamento ·
      Modelo · Avançado (reusa `AgentFormFields`); `observer` = híbrido;
      sistema pausa, não exclui; prompt/modelo do observador só owner.
- [ ] Redirects 307: suggestions→reviews, knowledge→knowledge, brain→memory,
      observer→agents/observer.
- [ ] "Ensinar a IA" na conversa: messaging:write propõe conhecimento;
      owner/admin também memória; trecho da mensagem selecionável/última msg
      pré-preenche; proposta vai pra Revisões com `sourceConversationId`.
- [ ] `proposeMemoryEntry` restrito a owner/admin/platform_admin.
- [ ] Refs: inbox-live toast → `/app/ai/reviews`; `live-refresh` prefix
      `/app/ai`; hub + ⌘K → `/app/settings/ai/agents`; i18n (Revisões,
      Memória, Credenciais e uso, namespace `ai.*` real).
- [ ] Gate verde + e2e/visual.

## Tarefas

1. **Core**: `proposeKnowledgeEntry` em `suggestions/service.ts` (assert
   `messaging:write`; target `knowledge_entry`; `sourceConversationId`;
   emit `agent_suggestion.created`) + export; restringir
   `proposeMemoryEntry` a owner|admin|platform_admin.
2. **Módulo `/app/ai`**: `layout.tsx` (gate `ai:read` + faixa Resumo +
   `AiModuleTabs`), `page.tsx`→redirect reviews; `git mv`
   suggestions→reviews, knowledge→knowledge, brain→memory (páginas; seções
   ficam co-localizadas ou movem junto — decidir pelo import graph).
3. **Settings técnico**: `ai-tabs` → 2 tabs; `settings/ai/page.tsx` →
   agents; redirects das rotas movidas; `agents/[id]/page.tsx` +
   `agent-detail.tsx` (form em 4 seções + ações pause/delete por kind;
   `observer` híbrido: `ObserverSection` + campos do agente, prompt/modelo
   read-only p/ não-owner).
4. **Ensinar a IA**: action `proposeKnowledgeEntryAction` (e memória já
   existe); `TeachAiDialog` (trecho + tipo + título/conteúdo ou proposta de
   memória); botão no `conversation-pane` (ou aside) por papel.
5. **Refs + i18n**: inbox-live, live-refresh (+test), hub, app-shell-menu,
   `settings.ai.tabs` (Revisões/Memória/Credenciais e uso), `ai.*` strings.
6. **e2e + gate**: redirects e tabs num spec; gate completo; visual owner +
   manager (propor vê restringido) + agent (sem módulo) + viewer (leitura).

## Escopo

apps/web/src/app/app/ai/**
apps/web/src/app/app/settings/ai/**
apps/web/src/components/inbox-live.tsx
apps/web/src/components/conversation-pane.tsx
apps/web/src/components/conversation-aside.tsx
apps/web/src/components/composer.tsx
apps/web/src/components/teach-ai-dialog.tsx
apps/web/src/lib/live-refresh.ts
apps/web/src/lib/live-refresh.test.ts
apps/web/src/server/services.ts
apps/web/src/server/actions/ai.ts
apps/web/src/app/app/settings/hub.ts
apps/web/src/components/app-shell-menu.ts
packages/core/src/modules/suggestions/**
packages/core/src/modules/knowledge/**
apps/web/messages/pt-BR.json
apps/web/e2e/ai.spec.ts

## Fora de escopo

- Gasto/custo na faixa Resumo (PREV na spec) e "testar" credencial (PREV).
- Sino de alertas real (Slice 6); resumo diário do Início (Slice 6).
- Filtro por tipo/Histórico em Revisões: implementar só se não existir.
- "Ensinar a IA" com seleção de trecho por highlight de DOM — a conversa não
  tem seleção assistida; o dialog aceita o trecho manual/última mensagem.
- Reordenar credenciais por drag — spec pede "lista ordenada" (já existe
  `priority` no schema; UI de reordem só se já houver affordance).
- Mudanças em observers/jobs, schema DB, outros módulos.

## Riscos

- `agents/[id]` com `id="observer"`: agente de sistema é lazy — usar
  `ensureSystemAgent`/`findSystemAgent` por kind; se ausente, tratar como
  config nova (form vazio em vez de 404).
- `proposeMemoryEntry` mais restrito pode quebrar fluxo de manager existente
  — é o que a spec manda; registrar no review.
- i18n: renomear só rótulos exibidos; namespaces `settings.ai.*` ficam mesmo
  quando a página migra (chaves não são rotas).
