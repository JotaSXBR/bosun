# Plan — Inbox backend pesado: busca no thread, menu de contexto, macros, ficha do contato (plano 3/3 do review)

- **Origem**: `TODO.md` → inbox UI review · `docs/product/inbox-ui-review.md` (B1, B2, B3, C1)
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-13

## Objetivo

Completar os itens aprovados do review de inbox que ficaram pro plano 3:
busca real dentro do thread (jump com contexto ±N), menu de contexto
(botão direito) nas mensagens, macros `/` por org com proposta de agente →
aprovação, e ficha de contato estilo Google People com tags próprias.

## Contexto

Decisões do gate (usuário, 2026-10-13):

- **Etiquetas**: contato ganha tags próprias (`contact_labels`, reusando a
  tabela org-level `labels` de leads) **e** a conversa mantém suas
  etiquetas — as duas superfícies vivem dentro do card da ficha.
- **Busca no thread**: jump real — clicar num resultado fora da janela
  carregada re-renderiza o thread com a janela ±N ao redor da mensagem +
  affordance "voltar ao final". `listMessages` é janela tail-limitada, sem
  cursor — o jump precisa de query própria (`listMessagesAround`).
- **Macros**: página nova `/app/settings/service/macros` — CRUD direto
  para manager/admin/owner + seção "pendentes" (aprovação); agente propõe
  via `agent_suggestions` (`targetType: 'macro'`, `proposedBy` = agente)
  → `agent_suggestion.created` → toast SSE existente; aprovar materializa
  a macro. Quatro-olhos do módulo suggestions já se aplica.
- **Ficha**: campos extras do contato (`email`, `phone` secundário,
  `notes`) vivem em `contacts.metadata` jsonb — sem colunas novas;
  `displayName` editável é coluna real. `channelUserId` NÃO é editável
  (é a identidade do canal — editar quebraria o mapeamento do provider).
- **Provisória**: trigger da macro = o campo `name` (slug tipo `saudacao`),
  digitado como `/saudacao` no composer; picker filtra por prefixo.
- **Provisória**: menu de contexto = `onContextMenu` abrindo o mesmo
  `MessageMenu` num portal flutuante na posição do cursor (não é o menu
  nativo do SO — "nativo" aqui = gesto de botão direito).

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

apps/web/src/app/app/inbox/**
apps/web/src/app/app/settings/**
apps/web/src/components/**
apps/web/src/server/actions/**
apps/web/src/server/services.ts
apps/web/messages/**
packages/db/**
packages/core/package.json
packages/core/src/modules/messaging/**
packages/core/src/modules/contacts/**
packages/core/src/modules/leads/**
packages/core/src/modules/macros/**
packages/core/src/modules/suggestions/**
design-system/src/lib/icon-paths.ts

## Fora de escopo

- `packages/channels` (mediaKind enum, adapters), `packages/automation`,
  `packages/ai` — planos 1/2 já entregaram o que consomem aqui.
- SLA, CSAT, broadcasts, round-robin, fila por prioridade (pós-v1).
- Seleção de modelo OpenAI por credencial (BYOK UI) — documentado, outro plano.
- Sync de contatos com Google/externo — ficha é local only (spec E2).
- Auto-resposta de IA para mídia não suportada (pendência registrada no TODO).
- Paginação infinita do thread — só o jump ±N; load-more geral fica fora.

## Tarefas

1. **Migration** — `macros` (org_id, name único por org, content,
   created_by, RLS FORCE) + `contact_labels` (contact_id + label_id,
   unique par, RLS) seguindo o checklist de tabela tenant (policy +
   `FORCE ROW LEVEL SECURITY` + grant via migration).
2. **Macros domínio** — `packages/core/src/modules/macros`: schemas Zod,
   repo (list/create/update/delete por org), service com
   `messaging:write`+role gate (manager/admin/owner escrevem; agent só lê
   e propõe), index exports, int test básico.
3. **Proposta de macro** — suggestions: `targetType: 'macro'` aceito,
   `proposeMacro` (agent) grava pending; `reviewMacroSuggestion` (approve)
   materializa a macro na mesma tx; reject fecha. Proposer não aprova a
   própria (regra de quatro-olhos existente).
4. **Settings page** — `/app/settings/service/macros`: lista + editor
   (manager+) + seção "Pendentes" com aprovar/rejeitar (manager/admin/
   owner); link no menu de settings; i18n.
5. **Composer `/`** — ao digitar `/` inicia picker com macros filtradas
   por prefixo; selecionar substitui o gatilho pelo content (texto e, se
   houver, vai direto pro campo); hint "propor macro" para agent →
   dialog mínimo que chama a proposta.
6. **Ficha do contato (domínio)** — `updateContactProfile` (displayName +
   `metadata.email|phone|notes`), `list/setContactLabels` reusando
   `labels` org; actions + services wrappers; int test.
7. **Ficha do contato (UI)** — card no aside: avatar + campos inline-edit
   (Google People: click → input), tags do contato (label picker),
   etiquetas da conversa movidas pra dentro do card.
8. **Busca no thread (domínio)** — `searchConversationMessages` (match em
   `content->>'text'` ILIKE, até 20) + `listMessagesAround` (janela ±N por
   sent_at/created_at ao redor do alvo); schemas + int test.
9. **Busca no thread (UI)** — campo discreto no header do pane; dropdown
   de resultados (preview+data); click → scroll+highlight se renderizado,
   senão re-render com janela ±N + "voltar ao final" (limpa o modo
   around e volta pro tail).
10. **Menu de contexto** — `onContextMenu` no bubble abre o MessageMenu
    flutuante na posição do cursor (portal, fecha em click-outside/Esc).
11. **i18n + polish + gate** — pt-BR completo, tokens DS,
    `pnpm verify` + `verify:full`.

## Critérios de pronto

- [ ] `pnpm verify` verde
- [ ] Testes alvo: `messaging/*.int.test.ts` (search/around), `macros`
      int, suggestions macro-review int, contacts profile/labels int
- [ ] Docs atualizadas: `TODO.md`, `tasks/todo.md`
- [ ] `/review` do diff inteiro no final
