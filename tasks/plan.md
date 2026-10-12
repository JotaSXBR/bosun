# Plan — Perf: etapa 4 (decisões F5/F6/F15 + deferrals documentados)

- **Origem**: `docs/audits/perf-baseline-2026-10-11.md` (F5, F6, F15) ·
  `TODO.md` → "P2 — Perf" · PRs #29–#31 (etapas 1–3)
- **Lifecycle**: /spec (auditoria) ✅ → /plan → /build → /test → /review → /ship
- **Branch**: `perf/audit-etapa-4` (a partir de `main` pós-#31)
- **Data**: 2026-10-12

## Decisões (usuário, 2026-10-12)

- **F5**: filtrar por tipo + escopo de página — refresh só para eventos que
  mudam dados visíveis na página atual; suggestions continuam só toast.
- **F6**: só throttle do `touchSiteChatSession` (>5min) — mux de LISTEN
  fica fora (documentado no código: "revisit at scale").
- **F15**: fix rápido agora — cache immutable + reservar espaço da imagem.
- **F7**: fechado como decisão documentada — tx por evento é deliberado
  (ordem + isolamento de falha); batching mudaria semântica.
- **F9**: deferido com gatilho (kanban precisa dos cards; reorder em sets
  pequenos — revisit quando board > centenas de cards).
- **F13**: deferido (ILIKE sobre fatia da org; pg_trgm se busca ficar lenta).

## Contexto verificado

1. `InboxLive` monta no layout `/app` — evento qualquer → refresh em TODAS
   as páginas/abas. `contact.presence` já é exceção; suggestions toastam.
   Catálogo de tipos: `message.*`, `conversation.*`, `agent_suggestion.*`,
   `connection.status`. Mapa página→dados:
   - `/app/inbox*` → `message|conversation|agent_suggestion` (cards na thread)
   - `/app/contacts*` → `conversation.*` (conversationCount na lista)
   - `/app/integrations*` → `connection.status`
   - `/app/settings*` → `agent_suggestion.*` + `connection.status`
   - `/app` home (onboarding), `/app/deals`, `/app/setup` → nada
2. `resolveWidgetSession` → `touchSiteChatSession` (write) em TODO read:
   `getWidgetConversation` (poll), `getWidgetStreamTarget` (connect SSE),
   `sendWidgetMessage`. `lastSeenAt` não tem outro consumidor — sinal de
   atividade puro; granularidade de 5min preserva a semântica.
3. `messages.content.type='media'` não tem width/height → reservar caixa
   `aspect-[4/3]` + `object-contain` (sem crop, sem CLS).
   `editMessageContent` só toca mensagens de texto (`type !== "text"` guard)
   → mídia por message-id é **imutável** → `immutable` seguro.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui. -->

- `apps/web/src/components/inbox-live.tsx`
- `apps/web/src/lib/live-refresh.ts`
- `apps/web/src/lib/live-refresh.test.ts`
- `apps/web/src/components/message-item.tsx`
- `apps/web/src/app/api/media/**`
- `packages/core/src/modules/messaging/sitechat.ts`
- `packages/core/src/modules/messaging/sitechat.int.test.ts`

## Fora de escopo

- Mux de LISTEN (decisão: deferido — comentário no realtime.ts já cobre).
- Refactor de invalidação direcionada (client data layer) — F5 futuro.
- F7/F9/F13 → documentação apenas (relatório + TODO).

## Tarefas

### Task 1 — F5: refresh escopado

`shouldRefreshForEvent(pathname, type)` puro + teste unitário da matriz;
`InboxLive` usa `usePathname`, refresh e indicador `hasNew` passam pelo
predicado; toasts de suggestion ficam como estão.
**Verify**: unit test verde; typecheck.

### Task 2 — F6: throttle do touch

`resolveWidgetSession` só chama `touchSiteChatSession` quando
`lastSeenAt` > 5min atrás. Int test em sitechat: poll repetido não
escreve; sessão velha escreve.
**Verify**: sitechat int verde.

### Task 3 — F15: cache + CLS de mídia

`cache-control: private, max-age=86400, immutable` na rota (imutável por
message-id — confirmado que edição só toca texto); `MediaContent` em
caixa `aspect-[4/3]` + `object-contain`.
**Verify**: typecheck + lint; revisão visual não-automatizada (sem
imagem de teste à mão — asserção é de markup).

### Task 4 — docs: deferrals + resultados

Relatório seção I (etapa 4) + status de F5/F6/F15; F7/F9/F13 como
"decisão deferida documentada" com gatilhos; TODO.md.
**Verify**: format + gate completo + commits atômicos.

## Critérios de pronto

- [ ] Gate completo verde
- [ ] Refresh só dispara em (página, evento) com dados afetados — teste prova
- [ ] Poll do widget não escreve em sessão fresca — teste prova
- [ ] Mídia: `immutable` + espaço reservado (sem CLS)
- [ ] F7/F9/F13 documentados como deferidos com gatilho
- [ ] Relatório e TODO atualizados
