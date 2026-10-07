# Design-system lint — @shadcn/lint

Status: **piloto (warn)** — plugin instalado em `apps/web` + `packages/ui`
desde o spike de 2026-10-07. Regras em `warn` não quebram `pnpm lint`/CI.

## O que é

`@shadcn/lint` (0.2.x) — plugin ESLint que transforma regras de design
system Tailwind v4 em diagnósticos verificáveis por agentes: o erro diz o
que quebrou, qual token usar e onde achar. Requer Tailwind v4 + ESLint ≥9.30
(ambos presentes).

## Baseline medido no repo (spike)

| Regra                    | apps/web | packages/ui | Leitura                                                                                                                                                        |
| ------------------------ | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-unknown-classes`     | 0        | **41**      | 1 root cause: `tw-animate-css` nunca foi importado — `animate-in`/`fade-*` dos dialogs/dropdowns **mortas desde o bootstrap**. Bug real encontrado pelo spike. |
| `no-arbitrary-values`    | 4        | 19          | Web: drift real (`text-[10px]`, `max-w-[80%]`). UI: internals shadcn legítimos (`top-[50%]`, `ring-[3px]`, `grid-cols-[1fr_auto]`) — allowlist, não correção.  |
| `no-raw-colors`          | 17       | 6           | Quase tudo amber/emerald semântico (notas, badges, health) — **o tema não tem tokens success/warning**. Gap de DS, não drift.                                  |
| `no-inline-styles`       | 4        | 0           | Todos dinâmicos legítimos (transform dnd-kit, `colorScheme`, swatch de cor).                                                                                   |
| `require-static-classes` | 1        | 0           | className montado dinamicamente no lead-panel.                                                                                                                 |

## Recomendação de adoção

1. **Bug**: importar `tw-animate-css` no `globals.css` (restaura animações
   shadcn mortas — dialogs, dropdowns, toasts).
2. **DS**: adicionar tokens semânticos (`success`, `warning`, `info`) ao
   tema — necessário independente do lint (badges/notas/health usam raw
   palette hoje).
3. **Regras como error** (só arquivos novos via overrides, backlog warn):
   - `no-unknown-classes` — error após fix do import (pega typo de classe
     de graça).
   - `no-arbitrary-values` — error em `apps/web`; em `packages/ui` com
     `allow` dos padrões internos shadcn (centering/ring/data-attr).
   - `no-raw-colors` — warn → error quando tokens semânticos existirem.
   - `no-inline-styles` — warn permanente (dinâmicos legítimos existem).
   - `require-static-classes` — warn permanente.
   - `no-restyle` — **adiado**: contratos por componente só depois do DS
     assentar (decisão do usuário).
