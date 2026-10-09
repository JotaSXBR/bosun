# Plan — Design system BOSUN

Brief: `.task-brief.md`. Decisões do usuário estão lá (`## Contexto`).

## 1. Triagem do dump (resultado — fechado)

Comparação feita: `_ds_bundle.js` contém cópias compiladas (JSX→createElement) de todos os
`components/**/*.jsx` e `ui_kits/**/*.jsx`; diff de literais/identificadores mostrou só artefatos
de compilação → **fontes `.jsx` são canônicas**, bundle é derivado. Não há versões duplicadas de
componente em pastas diferentes; não há `DESIGN.md` em nenhuma subpasta (será criado na raiz).

| Grupo                       | Arquivos                                                                                                                                                             | Destino                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Canônico — tokens           | `tokens/{colors,typography,spacing,effects,patterns,base,fonts}.css`, `styles.css`                                                                                   | `design-system/src/styles/tokens/` (+ entry de referência)                                 |
| Canônico — componentes      | 24 componentes em 23 `*.jsx` (+ `.d.ts` = API, `.prompt.md` = uso), `iconPaths.js`                                                                                   | port TS em `design-system/src/components/`, `src/lib/icon-paths.ts`, `COMPONENTS.md`       |
| Canônico — assets           | `assets/icons/*.svg` (104), `fonts/*.woff2` (8)                                                                                                                      | `design-system/assets/{icons,fonts}/`                                                      |
| Canônico — guidelines       | `readme.md` (fundamentos), `guidelines/*.html` (23)                                                                                                                  | prosa → `DESIGN.md` + `design-system/README.md`; HTML → `reference/guidelines/`            |
| Canônico — templates        | `ui_kits/webapp/*`, `ui_kits/website/*`                                                                                                                              | padrões de composição → `src/templates/`; HTML → `reference/ui_kits/`                      |
| Canônico — lint             | `_adherence.oxlintrc.json`                                                                                                                                           | traduzido p/ ESLint (`tooling/eslint/design-system.js`); original em `design-system/lint/` |
| Canônico — instrução agente | `SKILL.md`                                                                                                                                                           | absorvido em AGENTS.md + DESIGN.md                                                         |
| Derivado                    | `_ds_bundle.js`                                                                                                                                                      | só em `reference/` (necessário p/ cards e kits renderizarem)                               |
| Derivado                    | `components/*/*.card.html` (6)                                                                                                                                       | `reference/components/` (especimes visuais)                                                |
| Interno                     | `_ds_manifest.json` (vira `reference/index.html`), `.thumbnail`, `thumbnail.html`, `scratch/harness.html`, `uploads/` (29 imagens Stockify — referência de terceiro) | não entram                                                                                 |
| Substituído                 | `components/core/interaction.js` (hover/press via JS)                                                                                                                | estados via CSS (`hover:`/`active:`/`focus-visible:`)                                      |

## 2. Estrutura alvo

```
design-system/                  # ex-packages/ui (git mv), pacote @crm/ui
  README.md                     # mapa da biblioteca
  COMPONENTS.md                 # uso de cada componente (ex-*.prompt.md, API TS)
  assets/icons/*.svg            # 104 Lucide (lucide-static 0.469.0)
  assets/fonts/*.woff2          # 8 (Inter, Manrope, JetBrains Mono)
  lint/adherence.oxlintrc.json  # export original (proveniência; regras ativas em tooling/eslint)
  reference/                    # HTMLs standalone — espelha a estrutura relativa do dump
    index.html                  # índice gerado do manifest
    styles.css                  # @import ../src/styles/tokens/*.css
    _ds_bundle.js
    guidelines/*.html
    components/<grupo>/<grupo>.card.html
    ui_kits/{webapp,website}/*
  src/
    styles/globals.css          # entry Tailwind (seção 3)
    styles/tokens/*.css         # tokens canônicos (CSS puro)
    styles/tokens.test.ts       # drift DESIGN.md ↔ tokens
    lib/utils.ts, lib/icon-paths.ts
    components/<kebab>.tsx      # 24 DS + dropdown-menu, form, label, textarea
    templates/<kebab>.tsx       # app-top-bar, user-menu, page-header, command-palette, empty-state, auth-layout
    showcase/*.tsx              # biblioteca inteira, estados, dark+light (rota dev-only em apps/web)
```

Exports `@crm/ui/components/*`, `@crm/ui/templates/*`, `@crm/ui/showcase`, `@crm/ui/lib/*`, `@crm/ui/globals.css`.

## 3. Vocabulário Tailwind (contrato — DESIGN.md documenta)

Tokens BOSUN ficam com os nomes originais em `:root` (CSS puro, sem layer). O `@theme inline`
expõe utilities com nomes **disjuntos** dos nomes shadcn (assim qualquer classe legada vira
`no-unknown-classes` = erro de lint depois da migração).

Cores (`bg-* text-* border-* ring-* fill-* stroke-*`):

| key                  | token                    | key                                            | token                                  |
| -------------------- | ------------------------ | ---------------------------------------------- | -------------------------------------- |
| page                 | --bg-page                | ink-strong                                     | --text-strong                          |
| sunken               | --bg-sunken              | ink                                            | --text-body                            |
| surface              | --surface-card           | ink-muted                                      | --text-muted                           |
| raised               | --surface-raised         | ink-subtle                                     | --text-subtle                          |
| raised-2             | --surface-raised-2       | ink-accent                                     | --text-accent                          |
| control              | --surface-control        | ink-on-signal                                  | --text-on-accent                       |
| control-hover        | --surface-control-hover  | ink-on-signal-muted                            | --text-on-accent-muted                 |
| control-active       | --surface-control-active | ink-inverse                                    | --text-inverse                         |
| inverse              | --surface-inverse        | ink-disabled                                   | --text-disabled                        |
| signal               | --surface-accent         | line-subtle / line / line-strong / line-accent | --border-subtle/default/strong/accent  |
| signal-hover         | --surface-accent-hover   | icon / icon-strong / icon-muted                | --icon-default/strong/muted            |
| signal-soft          | --surface-accent-soft    | success, warning, danger, info, running        | --status-*                             |
| overlay              | --surface-overlay        | success-soft … running-soft                    | --status-*-bg                          |
| data-1…5, data-track | --data-*                 | abyss-_, ocean-_, signal-50…900, steel-*, mist | escalas de marca (preferir semânticos) |

Tipografia: `font-display|sans|mono`; `text-display-xl|display|h1|h2|h3|h4|lg|md|sm|xs|2xs|metric-xl|metric|metric-sm`
(com line-height/tracking pareados); `tracking-display|heading|body|ui|eyebrow|mono`; pesos = defaults Tailwind.
Raios: `rounded-xs(6) sm(10) md(14) lg(18) xl(24) 2xl(32) pill card card-inner notch`.
Espaço: escala Tailwind (4px) = escala BOSUN; nomeados `h-control-xs|sm|md|lg`, `size-icon-btn`,
`size-icon-sm|md|lg`, `h-nav`, `gap-card-gap`, `p-card-pad`, `gap-gutter`; `max-w-page` (1440), `max-w-text` (680).
Efeitos: `shadow-control|card|raised|pop|glow|focus`, `ease-standard|enter|exit`,
`duration-instant|fast|base|slow|chart` (@utility), `backdrop-blur-overlay|glass`.
Padrões: `.bx-hatch .bx-hatch-h .bx-dots .bx-grid .bx-on-accent` (classes de `patterns.css`).

Tema: `:root` = dark; `<html data-theme="dark">`; ilhas `[data-theme="light"]`/`[data-theme="dark"]`.
`dark:` = `&:where([data-theme=dark], [data-theme=dark] *):not(:where([data-theme=light], [data-theme=light] *))`; `light:` análogo.
Estados forçados para o showcase: `hover`, `active`, `focus-visible`, `focus-within` também casam
`[data-preview~="hover|active|focus"]` no elemento.

Fontes: `next/font/google` (Manrope, Inter normal+italic, JetBrains Mono; `latin`+`latin-ext`;
variáveis `--font-manrope|inter|jetbrains-mono` **no `<html>`**); `typography.css` usa
`var(--font-manrope, 'Manrope')` etc. → app usa next/font, referência usa `fonts.css`.

## 4. Fatias (handoffs)

1. **Fundação**: mover pacote, copiar canônicos, referência, globals.css + bloco legado TEMP (aliases shadcn), fontes, tema.
2. **Componentes**: 24 DS + 4 mantidos restilizados; drift test DESIGN.md.
3. **Templates + showcase** (`/design-system`, dev-only).
4. **Migração**: call sites `apps/web` → API DS; remover bloco legado; shell `/app`; sign-in/sign-up.
5. **Lint de aderência** + `COMPONENTS.md` + gate final (format, lint, typecheck, test, build, e2e, showcase, referência).
6. **Docs** (lead): DESIGN.md, AGENTS.md, README, CONTRIBUTING, design-system/README.md, vision, ADR 0017, design-system-lint.md, TODO.
7. **Commits** atômicos → apagar `design-system-export/`.
