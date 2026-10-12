# Plan — Slice 3: hub de Configurações (índice, rotas novas, redirects, Plataforma)

- **Origem**: `docs/product/ia-navegacao.md` §§3–6, §7.7, §10–11 (ordem 3) — spec aprovada 2026-10-12
- **Lifecycle**: /spec ✅ (doc aprovado) → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-12

## Objetivo

`/app/settings` vira o hub agrupado por objeto (Organização, Atendimento,
Canais, Negócios, Inteligência) com itens filtrados por permissão; cria a
árvore de rotas nova movendo telas existentes e stubs para as PARCIAL;
redireciona rotas antigas; separa Plataforma em `/app/platform`.

## Contexto (decisões do usuário)

- **PARCIAL vira stub com endereço real** (Membros, Plano e uso, Auditoria,
  Horário); **PREV fica fora** (Etiquetas, Campos personalizados).
- **`/app/settings/ai` fica como está** — divisão em agentes+credenciais e
  moves para `/app/ai/*` acontecem no Slice 5 (alvos de redirect não podem
  404). Hub linka para `/app/settings/ai` direto.
- **Funis move de verdade**: gestão sai do quadro (`/app/deals`) para
  `/app/settings/sales/funnels`; o quadro ganha atalho "Editar funil".
- **`agent`/`viewer` acessando `/app/settings` direto veem hub filtrado**
  (servidor segue validando cada página interna).
- **Plataforma separada**: `platform-settings.tsx` sai de `/app/settings` e
  renderiza em `/app/platform` (stub do Slice 2 vira página real).

## Detalhes da spec aplicados

- Grupo Organização = `organization:update` (owner/admin) — §4 n.1.
- Atendimento: Equipes `teams:manage`; Horário/Regras `organization:update`.
- Canais `integrations:manage`; Negócios `leads:manage`; Inteligência
  `ai:manage` (hub só é alcançável via engrenagem = alguma gestão).
- §7.7: `integrations/page.tsx` usa `ctx.role !== "agent"` (inclui viewer) —
  trocar por `hasPermission(role, { integrations: ["manage"] })`.
- Redirects deste slice: `/app/integrations` → `/app/settings/channels`;
  `/app/settings/teams` → `/app/settings/service/teams`. Os de `settings/ai/*`
  ficam para o Slice 5 (alvos `/app/ai/*` ainda não existem).
- `/app/settings` antiga (form) é dividida: `timezone` vai para
  `organization/general`, `offHoursMessage` para `service/hours`,
  `ticketReopenWindowHours` para `service/rules`. Campo `locale` fica
  **escondido** (§10.4 — só pt-BR por ora): sai do form, permanece na coluna.
- Checklist do Início: `connect_channel` → `/app/settings/channels`,
  `create_team` → `/app/settings/service/teams`,
  `create_funnel` → `/app/settings/sales/funnels`.
- `revalidatePath` e `live-refresh` seguem as rotas novas.
- Idioma da organização não edita — §10.4 (esconder enquanto só pt-BR).

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

apps/web/src/app/app/settings/**
apps/web/src/app/app/integrations/**
apps/web/src/app/app/platform/**
apps/web/src/app/app/deals/page.tsx
apps/web/src/app/app/page.tsx
apps/web/src/components/kanban-*.tsx
apps/web/src/components/funnel-dialogs.tsx
apps/web/src/components/new-funnel-button.tsx
apps/web/src/components/app-shell-menu.ts
apps/web/src/components/app-shell.tsx
apps/web/src/server/actions/integrations.ts
apps/web/src/server/actions/teams.ts
apps/web/src/server/actions/platform.ts
apps/web/src/lib/live-refresh.ts
apps/web/src/lib/live-refresh.test.ts
apps/web/e2e/settings.spec.ts
apps/web/messages/pt-BR.json

## Fora de escopo

- Restruturação de `/app/settings/ai` (abas → agentes+credenciais) e moves
  para `/app/ai/*` — Slice 5.
- ~~Sub-rotas de `/app/platform/{email,billing,meta,ai}`~~ — implementadas:
  spec §3 lista as rotas; índice `/app/platform` + `[group]` por grupo.
- Conteúdo real de Membros/Plano/Auditoria/Horário (são stubs) e de
  Etiquetas/Campos (PREV — nem entram no hub).
- Conteúdo de Minha conta (Slice 7), Alertas reais no sino (Slice 6).
- `design-system/**` — hub usa Card/EmptyState/PageHeader como estão.
- Mudanças em `packages/**` — nenhuma permissão nova necessária.

## Tarefas

1. **Hub index** — `/app/settings/page.tsx` vira índice: PageHeader +
   um Card por grupo (Organização, Atendimento, Canais, Negócios,
   Inteligência) com itens ícone+label+descrição+chevron (mesmo padrão da
   lista "sections" atual), filtrado por permissão; zero grupos visíveis →
   `EmptyState`. `SettingsForm`/`PlatformSettings` saem da página.
   Verify: typecheck + visual owner/manager/agent.
2. **Organização** — `organization/general` (timezone real, locale fora);
   stubs `organization/{members,billing,audit}` (PageHeader+EmptyState).
   Verify: rotas 200 owner/admin; manager não vê o grupo no hub e leva 404.
3. **Atendimento** — move `settings/teams` → `settings/service/teams`;
   `service/hours` (campo offHours real); `service/rules` (reopen real);
   `settings/teams` → redirect. Form antigo é desfeito.
   Verify: redirect funciona, página real responde.
4. **Canais** — move `integrations` → `settings/channels` (página +
   componentes colados); `/app/integrations` → redirect; `canManage` vira
   `hasPermission(integrations:manage)` (§7.7).
   Verify: redirect + viewer não vê formulários de gestão.
5. **Negócios** — `settings/sales/funnels` real: lista de funis + gestão de
   etapas reaproveitando `funnel-dialogs`/`kanban-dialogs`; quadro perde
   edição de etapa/funil → atalho "Editar funil" (canManage) → settings;
   estado vazio do quadro linka para o hub.
   Verify: criar funil/etapa pelo hub, quadro sem botões de edição.
6. **Plataforma** — `/app/platform` renderiza `PlatformSettings` (move o
   arquivo); gate `isPlatformAdmin` → notFound mantido.
   Verify: platform_admin vê grupos; owner 404.
7. **Redirects + refs** — páginas-redirect (`redirect()` do next/navigation);
   `revalidatePath` em `actions/integrations.ts` e `teams.ts` → rotas novas;
   `live-refresh.ts` → `/app/settings/channels`; checklist do Início;
   `app-shell-menu.ts` ⌘K (Canais→`/app/settings/channels`,
   Atendimento→`/app/settings/service/teams`,
   Organização→`/app/settings/organization/general`,
   Negócios→`/app/settings/sales/funnels`).
   Verify: grep sem refs às rotas antigas fora dos redirects.
8. **i18n + gate** — chaves `settings.hub.*` (grupos, itens, descrições) e
   stubs; `pnpm typecheck` + `pnpm lint` + testes alvo; `TODO.md`.

## Critérios de pronto

- [ ] `pnpm typecheck` + `pnpm lint` verdes (zero warnings novos)
- [ ] Hub filtra por papel (owner/manager/agent conferidos no Chrome)
- [ ] Rotas novas respondem; redirects antigos funcionam (deep links vivos)
- [ ] Funis/etapas gerenciados no hub; quadro só com atalho
- [ ] `/app/platform` real para platform_admin; 404 para os demais
- [ ] `TODO.md` atualizado (Slice 3)
