# Plan — Slice 6: Início "Hoje" + Alertas (sino)

## Contexto

`docs/product/ia-navegacao.md` §3/§8 transforma o Início em tela de trabalho
("Hoje") e liga o sino a avisos reais (hoje: empty state fixo).

Estrutura alvo do Início (§3):

- **Esperando por você**: Fila (n) → `?view=queue`, Minhas (n) → `?view=mine`.
- **Precisa de atenção** `[integrations:manage]`: conexões com problema
  (`status` = `error`/`disconnected`) → `/app/settings/channels`.
- **Revisões de IA** `[ai:manage]`: propostas pendentes (n) → `/app/ai/reviews`;
  memórias vencidas (n) → `/app/ai/memory`.
- **Primeiros passos**: checklist existente — só enquanto incompleto.
- Sai do Início: card id/papel e lista crua de auditoria. A auditoria vai
  para `settings/organization/audit` (stub vira real — mesma query,
  `audit:read`); id/papel ficam para Minha conta (Slice 7).

Sino (§3 "Alertas"): itens computados por papel —

- `[ai:manage]` propostas pendentes → `/app/ai/reviews`;
- `[integrations:manage]` uma linha por conexão com problema → channels;
- `[messaging:read]` transferências recentes **para mim** (notas privadas
  `metadata.system='transfer'`, `toAssigneeId=userId`) → `?view=mine&c=<id>`.

Decisões registradas:

- **"Atribuição" = eventos de transferência**, não contagem (contagem já é
  "Minhas"). Sem read-state/dismiss — avisos computados ao vivo (PARCIAL
  na spec; persistência seria infra nova, fora deste ciclo).
- Badge no sino: `IconButton dot` (prop já existe no DS) quando há alertas.
- Auditoria crua migra para a página de Auditoria (spec §3 marca a saída;
  a página stub existe com gate `audit:read` — mover a lista torna a
  remoção não-destrutiva).
- Título da página vira "Hoje"; org continua no topo via shell.

## Critérios de pronto

- Início mostra os 3 blocos por papel + checklist só se incompleto.
- Sino lista os 3 tipos de aviso com link correto e `dot` quando >0.
- `settings/organization/audit` lista os últimos eventos (era stub).
- Gates idênticos às permissões citadas (server-side).
- e2e/verificação Chrome: owner (todos os blocos+itens), agent (só
  Esperando+checklist, sem blocos de gestão).

## Escopo

apps/web/src/app/app/page.tsx
apps/web/src/app/app/layout.tsx
apps/web/src/app/app/settings/organization/audit/**
apps/web/src/components/app-shell.tsx
apps/web/src/components/app-shell-menu.ts
apps/web/src/server/services.ts
apps/web/src/server/alerts.ts
packages/core/src/modules/messaging/**
apps/web/messages/pt-BR.json
apps/web/e2e/home.spec.ts
apps/web/e2e/auth-flow.spec.ts
apps/web/src/lib/live-refresh.ts
apps/web/src/lib/live-refresh.test.ts

## Tasks

1. **Core**: `listMyTransfers(db, ctx, {limit,sinceDays})` em messaging —
   messages `private` + `metadata->>'system'='transfer'` +
   `metadata->>'toAssigneeId'=ctx.userId`, desc, limite (ex.: 5/14d).
   `messaging:read`. Export + `services.ts`.
2. **Início**: blocos Esperando (Fila/Minhas c/ contadores), Precisa de
   atenção (conexões error/disconnected), Revisões de IA (pendentes+
   vencidas); checklist só se incompleto; remover card conta e auditoria;
   título "Hoje".
3. **Auditoria**: stub → lista real (move a query do Início, `audit:read`,
   `listRecentAuditEvents` limit 50).
4. **Sino**: alertas computados no `layout.tsx` (3 queries por papel) →
   `AppShell` → `AlertsMenu` (lista de itens c/ ícone+label+href; dot no
   sino; empty state preservado).
5. **i18n**: `dashboard.*` novos blocos + `nav.alerts*` itens; remover
   chaves mortas se houver.
6. **e2e+gate**: spec básica de Início (blocos por papel) + gate completo +
   visual Chrome (owner/agent, 1536 piso).

## Fora de escopo

- Read-state/dismiss de alertas, tabela de notificações, push.
- Minha conta real (Slice 7) — id/papel sai do Início sem destino novo.
- Preferências de alerta por usuário.
