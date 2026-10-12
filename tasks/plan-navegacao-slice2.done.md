# Plan — Slice 2: shell por papel + AppShell 100dvh + stubs de módulo

- **Origem**: `docs/product/ia-navegacao.md` §§3–4, §11 (ordem 2) + `docs/product/layout-desktop-app.md` §4 — specs aprovadas 2026-10-12
- **Lifecycle**: /spec ✅ (doc aprovado) → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-12

## Objetivo

Aplicar o shell novo do produto no `/app`: `AppShell` 100dvh, barra de
módulos ciente do papel (com Inteligência, sem Integrações/Configurações),
engrenagem de Configurações no topo, `UserMenu` com Minha conta / Trocar de
organização / Plataforma, ⌘K ampliado — e criar as rotas stub que os itens
novos precisam (`/app/ai`, `/app/account`, `/app/platform`).

## Contexto

- **Formato (decisão do usuário)**: aplica-se o `AppShell` 100dvh — "o site
  não cresce para baixo, o que desce é o conteúdo". A confusão anterior era
  o letterbox da emulação, não o formato.
- **Inteligência (decisão do usuário)**: entra no menu já no Slice 2 com
  stub mínimo em `/app/ai` (PageHeader + estado vazio), gated por `ai:read`
  no servidor — o módulo completo é o Slice 5.
- **Minha conta / Plataforma (decisão do usuário)**: stubs mínimos
  (`/app/account`, `/app/platform` com PageHeader + `EmptyState`) para os
  itens do `UserMenu` não caírem em 404 — implementação real nos Slices 3/7.
- **Layout usa `getTenantContext()`** (não `requireTenantContext`): `/app/setup`
  vive dentro do mesmo layout e o gate do wizard não pode redirecionar.
  Sem ctx (setup), o shell renderiza módulos base sem engrenagem/Inteligência.
- **Visibilidade por papel** (`ia-navegacao.md` §4 + §7.6): módulos de
  trabalho para todos (viewer lê); Inteligência só `ai:read` (agent não vê);
  engrenagem só quem tem permissão de gestão (`organization:update`,
  `teams:manage`, `integrations:manage`, `leads:manage`, `ai:manage`);
  Plataforma só `platform_admin`; Trocar de organização só com >1 org
  (`listUserOrganizations` + `authClient.organization.setActive`).
- **⌘K ampliado**: Módulos (filtrados), Configurações (5 grupos do hub
  apontando para os destinos atuais — viram rotas próprias no Slice 3),
  Minha conta, Ações.
- **UserMenu é flat** (sem submenu): cada outra organização vira um item
  "Trocar para {nome}" — suficiente para o PARCIAL do spec.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

apps/web/src/components/app-shell.tsx
apps/web/src/components/app-shell-menu.ts
apps/web/src/app/app/layout.tsx
apps/web/src/app/app/ai/**
apps/web/src/app/app/account/**
apps/web/src/app/app/platform/**
apps/web/messages/pt-BR.json
design-system/src/templates/app-shell.tsx

## Fora de escopo

- Rotas novas dentro de `/app/settings` (hub é Slice 3) — a engrenagem só
  linka para `/app/settings` como está.
- Conteúdo real de `/app/ai` (Slice 5), `/app/account` (Slice 7),
  `/app/platform` (Slice 3), `/app/settings/channels` e redirects (Slice 3).
- PageHeader compacto nas páginas de trabalho (Slice 4) — cada página segue
  com seu header atual dentro da região de conteúdo.
- `design-system/**` — o shell usa os templates como estão.
- Mudanças de `packages/permissions` — a matriz atual já cobre a visibilidade.
- Sino com avisos reais (Slice 6) — dropdown vazio continua.

## Tarefas

1. **Rotas stub** — `/app/ai` (`requireTenantContext` + `hasPermission
ai:read` → `notFound` se negado; `PageHeader` + `EmptyState`),
   `/app/account` e `/app/platform` (platform_admin → `notFound` se negado)
   com o mesmo padrão; i18n dos títulos/vazios.
   Verify: typecheck + rotas respondem (platform_admin vê as 3, agent 404
   em `/app/ai` e `/app/platform`... agent vê account — ela é de todos).
2. **Shell por papel** — `layout.tsx` busca `getTenantContext()` +
   `listUserOrganizations` e passa `role`/`isPlatformAdmin`/`organizations`;
   `app-shell.tsx`: módulos = Início, Atendimento, Contatos, Negócios (+
   Inteligência se `ai:read`), engrenagem `IconButton`→`/app/settings` só
   com permissão de gestão, `UserMenu` com Minha conta + itens "Trocar
   para {org}" (>1 org, `authClient.organization.setActive` + refresh) +
   Plataforma (platform_admin) + Sair; `activeModule` cobre `/app/ai`.
   Verify: typecheck + visual owner/agent/viewer.
3. **AppShell 100dvh** — `app-shell.tsx` envolve children no template
   `AppShell` (`topBar` = AppTopBar; páginas seguem com header próprio em
   children). Conferir inbox 3-painéis rolando interno e páginas de leitura
   rolando na região `main`.
   Verify: browser nos dois tamanhos — sem scroll de página nos módulos de
   trabalho; scroll normal nas de leitura.
4. **⌘K ampliado** — grupos Módulos (filtrados por papel), Configurações
   (Organização→`/app/settings`, Atendimento→`/app/settings/teams`,
   Canais→`/app/integrations`, Negócios→`/app/settings`, Inteligência→
   `/app/settings/ai`), Minha conta (`/app/account`), Ações (Sair).
   Verify: abre com ⌘K e navega.
5. **i18n + gate** — novas chaves `nav.*` e dos stubs em `pt-BR.json`;
   `pnpm typecheck` + `pnpm lint` + checagem visual 1920/1536; `TODO.md`.

## Critérios de pronto

- [ ] `pnpm typecheck` + `pnpm lint` verdes
- [ ] Testes alvo: nenhum novo (shell visual — conferido no browser)
- [ ] Menu/topbar/UserMenu corretos para owner, agent e viewer
- [ ] `/app/ai`, `/app/account`, `/app/platform` respondem com stub (gates por papel)
- [ ] Inbox rola interno (100dvh), leitura rola em `main`, sem overflow em 1536×740
- [ ] `TODO.md` atualizado (Slice 2)
