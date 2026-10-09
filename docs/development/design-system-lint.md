# Design-system lint — @shadcn/lint

Status: **adotado** — token rules em `error` em `apps/web` + `packages/ui`
(hoje `design-system/`, ADR 0017) desde 2026-10-07; `no-inline-styles`/
`require-static-classes` ficam `warn` (escapes dinâmicos legítimos:
transforms dnd-kit, geometria de chart, overrides numéricos explícitos).
Desde 2026-10-09 soma-se a **aderência BOSUN** (seção no fim).

## O que é

`@shadcn/lint` (0.2.x) — plugin ESLint que transforma regras de design
system Tailwind v4 em diagnósticos verificáveis por agentes: o erro diz o
que quebrou, qual token usar e onde achar. Requer Tailwind v4 + ESLint ≥9.30
(ambos presentes).

## Bugs encontrados pelo spike (corrigidos)

1. **Scan de conteúdo não cobria `packages/ui`** — auto-detection do
   Tailwind v4 usa o cwd do build (`apps/web`); toda classe exclusiva dos
   componentes internos (`top-[50%]` + translate do dialog, `min-w-[8rem]`
   do dropdown, `card-action`, animações) gerava **zero CSS**. Dialogs
   renderizavam no canto da tela. Fix: `@source "../"` no `globals.css`.
2. **`tw-animate-css` nunca importado** — `animate-in`/`fade-*`/`zoom-*`/
   `slide-*` mortas desde o bootstrap. Fix: dep + `@import`.
3. **Sem tokens semânticos** — raw palette amber/emerald/green/sky/red em
   23 lugares (badges, notas, health, presence, voice recorder). Fix:
   `success`/`warning`/`info` + `-foreground` em `:root`/`.dark`.

## Regras ativas (eslint configs)

| Regra                    | web                                | ui                                            |
| ------------------------ | ---------------------------------- | --------------------------------------------- |
| `no-unknown-classes`     | error                              | error (`allow: ["toaster"]` — hook do Sonner) |
| `no-arbitrary-values`    | error                              | error + allowlist dos internals shadcn        |
| `no-raw-colors`          | error                              | error                                         |
| `no-inline-styles`       | warn                               | warn                                          |
| `require-static-classes` | warn                               | warn                                          |
| `no-restyle`             | **off — adiado até o DS assentar** | idem                                          |

Baseline medido (spike): web 26 → 0 erros (5 warnings intencionais);
ui 66 → 0 findings. Allowlist de `packages/ui` cobre: `ring-[3px]`,
`grid-rows-[auto_auto]`, `grid-cols-[*]`, `top|left-[50%]`,
`translate-x|y-[-50%]`, `max-w-[*]`, `min-w-[*]`, `h-[var(*)]`,
`transition-[color,box-shadow]` — matching é na utility base (variants não
precisam constar no padrão).

## Aderência BOSUN (2026-10-09)

O export do Claude Design trazia `_adherence.oxlintrc.json` (guardado como
proveniência em `design-system/lint/adherence.oxlintrc.json`). O projeto
roda ESLint, não oxlint, então as regras foram portadas para
`tooling/eslint/design-system.js` (`@crm/eslint-config/design-system`):

| Regra do export                                                                  | Destino                                                                                                                                                                                              |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-restricted-syntax` — hex cru, `px` cru, fonte fora do DS                     | `designSystemSyntax` (seletores e mensagens verbatim), **`error`** em `src/**/*.tsx` de `apps/web` e `design-system`                                                                                 |
| `no-restricted-imports` — internals do DS                                        | `@typescript-eslint/no-restricted-imports` **`error`** em `apps/web` (`@crm/ui/src/**`, `design-system/{src,reference,assets}/**`); regra separada para não fundir com a fronteira de UI (core rule) |
| `no-restricted-syntax` — allowlists de props/enums por componente (44 seletores) | **não portadas**: o tipo TS de cada componente é o contrato (typecheck estrito pega prop/variante inválida). O export era JSX sem tipos                                                              |
| `react/forbid-elements` (`forbid: []`)                                           | não portada — lista vazia, no-op                                                                                                                                                                     |

Severidade `error` (o export usava `warn`) segue a política do repo para
regras de token com zero violações. Exceções são `eslint-disable-next-line
no-restricted-syntax -- <motivo>` só para **dado**, nunca estilo: cor de
equipe persistida (`teams-manager.tsx`, 3×), placeholder de formato hex
(`widget-panel.tsx`), `sizes` do `next/image` (`message-item.tsx`) e texto
de exemplo do showcase (`fundamentos.tsx`).

Allowlists atuais de `design-system/eslint.config.js` (só o que está em
uso): `no-arbitrary-values` → `ring-[3px]` (chip do RingChart),
`grid-cols-[*]` (grade de ícones do showcase),
`transition-[color,box-shadow]` (Textarea), `scale-[0.985]` (press do
Button), `transition-[width|left|stroke-dasharray]` (ProgressBar/RingChart);
`no-unknown-classes` → `toaster` (host Sonner do toast), `bx-*` (padrões e
card), `card-fillet`.
