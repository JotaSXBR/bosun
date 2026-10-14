# Todo — Inbox backend: busca, context menu, macros, ficha (plano 3)

- [x] **1. Migration** — `macros` + `contact_labels` (policy + FORCE RLS +
      grant crm_app) · verify: migrate sobe, isolamento cross-org
      (`0031_greedy_quasimodo.sql`)
- [x] **2. Macros domínio** — módulo `macros` (schema+repo+service+index);
      manager+ escreve, agent lê · verify: int test CRUD + permissão (9/9)
- [x] **3. Proposta de macro** — proposta via `agent_suggestions`
      (`targetType:'macro'` fora do enum config-class); approve materializa
      macro; quatro-olhos · verify: int test propose→approve/reject
- [x] **4. Settings page** — `/app/settings/service/macros` lista+editor+
      pendentes; hub entry (zap); i18n · verify: manager cria, agent propõe,
      pendência aparece
- [x] **5. Composer `/`** — picker por prefixo, selecionar injeta content;
      form de proposta inline (agent) · verify: `/` filtra e insere
- [x] **6. Ficha domínio** — `updateContactProfile` (displayName +
      metadata email/phone/notes) + `list/setContactLabels`; actions ·
      verify: int test persiste + isola (10/10)
- [x] **7. Ficha UI** — card no aside: campos inline-edit, tags contato,
      etiquetas da conversa dentro do card · verify: edita e persiste
- [x] **8. Busca domínio** — `searchConversationMessages` (ILIKE escapado) + `listMessagesAround` (±N por sent_at/created_at) · verify: int test
      janela correta (4 testes novos em reads.int.test.ts)
- [x] **9. Busca UI** — `ThreadSearch` no header + dropdown + jump via
      `?around=<id>#msg-<id>` (janela ±N server-side, ring `:target`,
      `JumpAnchor` scroll) + "Voltar ao final" · verify: pula e destaca
- [x] **10. Menu de contexto** — `onContextMenu` → `MessageContextMenu`
      flutuante no cursor (mesmas ações do `⋯`, edit dentro do popup);
      fecha Esc/click-outside/scroll · verify: botão direito abre
- [x] **11. i18n + polish + gate** — pt-BR (`inbox.search*`, `backToEnd`),
      tokens DS · `pnpm verify` ✅ + `verify:full` ✅ (int 295/295, e2e 17,
      build ok)

Gate: `pnpm verify:full` ✅ — format, lint 0 erros, typecheck 14/14,
unit 199/199, integração 295/295, e2e 17/17, build ✅.
