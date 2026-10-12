# TODO — Slice 3: hub de Configurações

- [x] **Task 1 — Hub index**: `/app/settings` vira índice com 5 grupos filtrados por permissão + EmptyState quando zero grupos; form/Plataforma saem. Verify: typecheck + visual por papel ✅
- [x] **Task 2 — Organização**: `organization/general` (timezone real); stubs members/billing/audit. Verify: rotas por papel ✅
- [x] **Task 3 — Atendimento**: teams → `service/teams` + redirect; `service/hours` (offHours); `service/rules` (reopen). Verify: redirect + páginas reais ✅
- [x] **Task 4 — Canais**: integrations → `settings/channels` + redirect; `canManage` via hasPermission (§7.7). Verify: redirect + viewer sem gestão ✅
- [x] **Task 5 — Negócios**: `settings/sales/funnels` real (reusa dialogs); quadro → atalho "Editar funil". Verify: criar funil/etapa no hub ✅
- [x] **Task 6 — Plataforma**: `platform-settings` move para `/app/platform` (gate platform_admin). Verify: admin vê grupos, owner 404 ✅
- [x] **Task 7 — Redirects + refs**: revalidatePath/live-refresh/checklist/⌘K para rotas novas. Verify: grep limpo ✅
- [x] **Task 8 — i18n + gate**: chaves `settings.hub.*`; typecheck + lint + testes; `TODO.md` ✅

## Resultado da verificação no browser

- **agent**: hub = EmptyState "Sem configurações disponíveis"; funnels→404, audit→404, channels→200 (só leitura).
- **manager**: Organização>Auditoria, Atendimento>Equipes, Canais, Negócios>Funis, Inteligência — exato §4.
  general→404, hours→404, platform→404; `/app/integrations`→channels, `/app/settings/teams`→service/teams (307).
- **owner**: hub completo (10 itens, 5 grupos); general/hours/rules 200; platform→404.
- **superadmin**: `/app/platform` índice 4 grupos + status; `/app/platform/email` form + link "configuração guiada"→/app/setup.
- **Quadro**: "Editar funil"→settings, menus de etapa removidos, kanban renderiza.
- **Layout**: 1536×740 sem rolagem horizontal; body não rola.
