# TODO — Slice 2: shell por papel + AppShell 100dvh + stubs de módulo

- [x] **Task 1 — Rotas stub**: `/app/ai` (gate `ai:read` → `notFound`), `/app/account`, `/app/platform` (platform_admin → `notFound`) — PageHeader + EmptyState + i18n. Verificado: owner 200 nas 3, agent 404 em `/app/ai` e `/app/platform`
- [x] **Task 2 — Shell por papel**: layout passa `role`/`isPlatformAdmin`/`organizations` (`getTenantContext` + `listMyOrganizations`); módulos filtrados + Inteligência; engrenagem só gestão; UserMenu (Minha conta, Trocar p/ org, Plataforma, Sair). Verificado no Chrome: owner vê 5 módulos + engrenagem; agent vê 4 módulos sem engrenagem
- [x] **Task 3 — AppShell 100dvh**: children dentro do template; scroller `div` (main único); `bodyScrolls:false`, conteúdo rola na região interna. Verificado: 889px e 1536×740 sem overflow
- [x] **Task 4 — ⌘K ampliado**: grupos Módulos/Configurações/Minha conta/Ações — verificado abrindo com Ctrl+K
- [x] **Checkpoint**: typecheck + lint + visual por papel; `TODO.md`
