# Plan — E1: fila operacional do Atendimento (3 painéis, tabs, filtros, snooze)

## Objetivo

Transformar `/app/inbox` em workbench master-detail (lista | thread |
painel direito) com as tabs `Automático | Fila | Minhas | Todas |
Adiados | Fechadas`, filtros (busca, aguardando resposta, canal, setor),
seções por setor na Fila, contadores, badges discriminantes e snooze
lazy. Spec: `docs/product/inbox.md`.

## Contexto (decisões)

- **Deep link preservado**: `/app/inbox/[id]` → redirect `?c=<id>` —
  uma rota canônica, zero duplicação de superfície.
- **Fila = `open` + sem assignee + não adiada** (definição atual
  mantida). Fechadas = `resolved|closed` (arquivada ≡ closed, sem
  estado novo).
- **`pending` entra no check de status agora** — a aba Automático
  renderiza vazia (estado honesto) até o intake mode existir; nada
  escreve `pending` ainda.
- **Snooze lazy**: `snoozed_until timestamptz`; queries tratam
  `<= now()` como ativa — sem sweep job, sem scheduler novo.
- **"Aguardando resposta"** = última msg inbound via `EXISTS` —
  sem cursor de leitura por usuário nesta fatia.
- **Badges discriminantes**: canal só se org tem >1 conexão ativa;
  atendente só quando a lista mista donos (regra anti-ruído do
  Deskcomm).
- **Seleção via `?c=` server-side** — filtros e seleção vivem em
  searchParams; sem estado de cliente novo; SSE existente
  (`inbox-live`) continua invalidando.
- **Painel direito reusa o complementary atual** (ticket actions +
  lead panel); a ficha completa é E2 e cai no mesmo slot.
- **Teclado mínimo**: `j`/`k`/`Enter` na lista.

## Tasks

- **T1 schema + repository**: `conversations.snoozed_until`, `pending`
  no status check; `listConversations` ganha views
  `pending|queue|mine|all|snoozed|closed` + filtros (search ILIKE
  nome/channelUserId/ticket, `channelConnectionId`, `sectorId`,
  `awaitingReply`), ordenação por view; `listConversationViewCounts`
  (1 query agrupada). Migration via `pnpm db:generate`.
- **T2 snooze**: service `snoozeConversation`/`unsnooze`
  (`messaging:write`) + actions; entrada "Adiar" no menu de ações do
  ticket (1h / amanhã 9h / próxima semana); badge "Adiada até" na
  linha e no aside.
- **T3 extração de componentes**: `[id]/page.tsx` vira
  `<ConversationPane>` (header + timeline + composer + cards IA) e
  `<ConversationAside>` (ticket meta + lead panel); `[id]` redirecta.
- **T4 inbox shell 3 painéis**: page.tsx nova — tabs+contadores,
  filtros, seções na Fila, lista de linhas ricas, seleção `?c=`,
  empty states, responsivo (lista↔thread abaixo de lg, aside esconde).
- **T5 i18n + int/e2e + browser check**: strings pt-BR, int tests do
  repository/views + snooze, gate completo + verificação visual.

## Escopo

- `packages/db/src/schema/messaging.ts`
- `packages/db/migrations/**`
- `packages/core/src/modules/messaging/**`
- `packages/automation/src/tasks/observer-analyze.ts`
- `apps/web/src/app/app/inbox/**`
- `apps/web/src/components/inbox-*.tsx`
- `apps/web/src/components/conversation-*.tsx`
- `apps/web/src/components/ticket-actions.tsx`
- `apps/web/src/server/actions/messaging.ts`
- `apps/web/src/server/services.ts`
- `apps/web/messages/pt-BR.json`
- `apps/web/messages/en.json`
- `apps/web/src/lib/ticket-status.ts`
- `design-system/src/styles/globals.css`
- `DESIGN.md`
- `apps/web/e2e/**`
- `tasks/**`
- `docs/product/inbox.md`
- `TODO.md`
