# Design-system lint — @shadcn/lint

Status: **adotado** — token rules em `error` em `apps/web` + `packages/ui`
desde 2026-10-07; `no-inline-styles`/`require-static-classes` ficam `warn`
(escapes dinâmicos legítimos: transforms dnd-kit, `colorScheme`, swatches).

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
