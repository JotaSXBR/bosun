# Plan — Slice 1: tokens de layout + PageHeader compacto + AppShell

- **Origem**: `docs/product/ia-navegacao.md` §11 (ordem 1) + `docs/product/layout-desktop-app.md` §§5–6 — ambos aprovados pelo fundador em 2026-10-12
- **Lifecycle**: /spec ✅ (docs aprovados, pulado) → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-12

## Objetivo

Entregar a base do novo layout no design system: os tokens da família
"Layout", a variante compacta do `PageHeader` com prop `back`, e o template
`AppShell` (grade `100dvh` com regiões de rolagem independentes) — tudo só
em `design-system/`, sem tocar `apps/web`.

## Contexto

- **Spec já existe e está aprovado**: os dois docs novos são a fonte da
  verdade; `/spec` foi pulado conforme `workflow.md` → "Quando /spec é
  obrigatório".
- **Granularidade (decisão do usuário)**: este plan cobre **só o Slice 1**
  da ordem sugerida (design system). Slices 2–7 (shell, hub de
  Configurações, Atendimento, Inteligência, Início, telas novas) ganham
  plan próprio.
- **`AppShell` (decisão do usuário)**: criado como template no design
  system + showcase; **não** é aplicado ao `/app` neste slice — a migração
  do shell entra no Slice 2.
- **Ponto de troca `-sm` (<1700px)**: os tokens `inbox-list-sm`/
  `inbox-aside-sm` entram agora; o mecanismo de troca (media/container
  query) só faz sentido onde a largura muda — fica para o Slice 4
  (Atendimento). Decisão provisória: registrar o limiar de 1700px no
  DESIGN.md como nota do token.
- **`viewport-ref`/`viewport-floor`**: entram como tokens informativos;
  o compromisso real é validado medindo `window.innerWidth/innerHeight`
  nos dois cenários antes de fechar o slice (`layout-desktop-app.md` §1/§7).
- **`adherence.oxlintrc.json`** é proveniência do export (não roda no
  lint do repo — esse é `tooling/eslint/design-system.js`, sem lista de
  tokens), mas recebe os tokens novos para não divergir.

## Escopo

<!-- Globs relativos à raiz. O hook bloqueia edições fora daqui.
     Inclua os testes e a pasta do pacote/rota — docs e .md são sempre livres. -->

design-system/src/styles/**
design-system/src/templates/**
design-system/src/showcase/**
design-system/src/components/icon-button.tsx
design-system/lint/adherence.oxlintrc.json

## Fora de escopo

- `apps/web/**` inteiro — nenhuma tela, rota, shell ou i18n do app muda
  (AppShell é aplicado no Slice 2).
- Mecanismo de troca referência ↔ piso (`-sm`) — só os tokens entram
  (Slice 4).
- `ModuleNav` barra inferior, PWA/manifest, indicador de conexão — itens
  "Reservado"/outros slices do `layout-desktop-app.md` §6.
- Qualquer mudança de navegação, rotas ou permissões (`ia-navegacao.md`
  §§3–7) — Slices 2–7.

## Tarefas

Slices finos em `design-system/`; cada um termina verde antes do próximo.

1. **Tokens "Layout"** — `DESIGN.md` front matter (`spacing:` ganha
   `viewport-ref: 1920px`, `viewport-floor: 1536px`, `page-pad: 32px`,
   `page-header-compact: 56px`, `inbox-list: 360px`, `inbox-list-sm: 320px`,
   `inbox-aside: 360px`, `inbox-aside-sm: 320px`, `thread-measure: 760px`,
   `kanban-column: 296px` + nota do limiar 1700px); mesmas vars em
   `tokens/spacing.css`; `@theme` em `globals.css`
   (`--spacing-page-pad`, `--spacing-page-header-compact`,
   `--spacing-inbox-list`, `--spacing-inbox-list-sm`,
   `--spacing-inbox-aside`, `--spacing-inbox-aside-sm`,
   `--spacing-kanban-column` e `--container-thread` → `max-w-thread`);
   sync no `adherence.oxlintrc.json` (allowlist + mapa `"spacing"`).
   Verify: `pnpm --filter @crm/design-system test` (drift test).
2. **`PageHeader` compacto + `back`** — prop `compact` (altura
   `page-header-compact` 56px, título `h3`, abas na mesma linha sem
   respiro extra) e prop `back` (`IconButton` `arrow-left` à esquerda do
   título, label pt-BR "Voltar" overridável); variantes novas no showcase
   (`showcase/templates.tsx`).
   Verify: `pnpm --filter @crm/design-system typecheck` + visual no
   `/design-system`.
3. **Template `AppShell`** — `templates/app-shell.tsx`: grade de altura
   fixa `100dvh` com `topBar` fixo, `header?` fixo e região de conteúdo
   `min-h-0`/`overflow` onde cada painel rola independentemente; seção no
   showcase com painéis de demonstração.
   Verify: typecheck + visual no `/design-system` (rolagem interna, sem
   scroll da página).
4. **Docs do DS** — `COMPONENTS.md` (variantes do `PageHeader` + entrada
   `AppShell`), `DESIGN.md` (linha Templates + vocabulário Tailwind do
   Implementation) e `design-system/README.md` (mapa da biblioteca).
5. **Gate + medição** — `pnpm typecheck` + `pnpm lint` +
   `pnpm --filter @crm/design-system test`; medir
   `window.innerWidth/innerHeight` no Chrome nos cenários 100% e 125%
   (confirmar ~1920×930 e ~1536×740) e conferir o `/design-system` nos
   dois tamanhos; `TODO.md` registra o item e o progresso do Slice 1.

## Critérios de pronto

- [ ] `pnpm typecheck` + `pnpm lint` verdes
- [ ] Testes alvo: `pnpm --filter @crm/design-system test` (drift test de tokens)
- [ ] Tokens novos com vocabulário Tailwind documentado no DESIGN.md
- [ ] `PageHeader` compacto/back e `AppShell` visíveis no `/design-system` nos dois tamanhos (1920×930 e 1536×740)
- [ ] `TODO.md` atualizado com o item e o andamento
