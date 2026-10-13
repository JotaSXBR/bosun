# TODO — Slice 6: Início "Hoje" + Alertas (sino)

- [x] **Task 1 — Core**: `listMyTransfers` (messaging:read; notas privadas
      de transferência para mim, desc, limite 5/14d, só tickets ativos) em
      `reads-transfers.ts` (split — reads.ts estourava 300 linhas) +
      export + `services.ts`
- [x] **Task 2 — Início**: Esperando por você (Fila/Minhas c/ n), Precisa
      de atenção (conexões error/disconnected, integrations:manage),
      Inteligência (revisões pendentes + memórias vencidas, ai:manage);
      checklist só se incompleto; removidos card conta + auditoria;
      título "Hoje" + org-name preservado
- [x] **Task 3 — Auditoria**: stub → lista real (`listRecentAuditEvents`
      50, gate audit:read) em settings/organization/audit
- [x] **Task 4 — Sino**: `loadShellAlerts` no layout → AlertsMenu itens c/
      ícone+href + `dot`; empty state preservado; agent_suggestion +
      connection (raro) refrescam o shell, conversation./message. ficam
      escopados (perf)
- [x] **Task 5 — i18n**: `dashboard.*` reescrito (waiting/attention/
      aiReviews), `nav.alert*` novas c/ plural; chaves conta mortas
      removidas
- [x] **Task 6 — e2e+gate**: `home.spec.ts` (owner + agent), auth-flow
      atualizado (audit-list agora em settings); live-refresh.test
      expandido; gate verde; Chrome owner/agent verificado

## Verificado (Chrome)

- **owner**: "Hoje" + org, Esperando (fila/mine com n reais),
  Inteligência (revisões=1/memórias=0), checklist; sino com dot +
  "1 revisão de IA pendente" → /app/ai/reviews
- **agent**: só Esperando + checklist; sino → empty state; sem cards
  de IA/canais (gates ai:manage/integrations:manage)
- **Auditoria**: lista real em /app/settings/organization/audit
  (gate audit:read → agent 404 pela matriz)
- Piso 1536×740: sem scroll horizontal; console limpo

## Gate

format:check ✅ · typecheck ✅ · lint 0 erros (arquivos do slice
0 warnings) · @crm/web 10/10 · @crm/core 46/46
