# Plan — DS ressalvas do review: inline-styles zerados + peerDeps

Brief: `.task-brief.md` · origem: review de `1acb2bd` · data: 2026-10-09

## Regra (lida em `@shadcn/lint` dist)

`shadcn/no-inline-styles`:

- Propriedade não-`--*` em objeto style → `inlineStyle`.
- Objeto só com chaves `--*` → OK, exceto se o valor for cor crua (`customPropColor`); `var(--x)` e `` `${n}px` `` passam.
- Spread `...style` (prop literalmente chamada `style`) → permitido.
- Spread condicional `...(cond && {...})` ou identifier não resolvível (`bodyStyle`, `inputStyle`) → `dynamicStyle`.
- Expressão `cond ? {...} : undefined` → só checa o objeto; `--*`-only passa.

## Padrão adotado

```tsx
style={{ "--avatar-d": `${d}px`, ...style }}   // flat, só --*; undefined omitido
className="size-(--avatar-d)"                   // Tailwind v4 var-shorthand
```

Quando o override é opcional, a **classe** é que fica condicional (var indefinida nunca é consumida); o objeto style fica flat sempre. Vars com aritmética (`padN-4`) são pré-computadas no JS (`--card-tab-pt`) em vez de `calc()` em classe arbitrária — mais legível.

## T1 — Componentes (warnings → estratégia)

| Arquivo                     | Caso                                                             | Fix                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `avatar.tsx`                | `width/height: d`, `fontSize: d*.38`, `statusSize`               | `--avatar-d` + `size-()`, `--avatar-fs` + `text-(length:)` , `--avatar-status` + `size-()`                                                                                                 |
| `bar-chart.tsx`             | `height`, `maxWidth` (coluna+label), `height: th/vh`             | `--chart-h` + `h-()`, `--bar-w` + `max-w-()` (var única), `--bar-h` + `h-()` por barra                                                                                                     |
| `card.tsx`                  | `fontSize: titleSize`                                            | `text-lg` ⇄ `text-(length:--card-title-fs) leading-(--text-lg--line-height)` condicional                                                                                                   |
| `card.tsx`                  | spreads radius/padding (plain + notched)                         | vars flat `--card-radius`/`--card-pad`/`--card-notch-gap`/`--card-notch-fillet`/`--card-tab-pt`/`--card-body-pt`; classes `rounded-()`/`p-()`/`px-()`/`pt-()`/`pb-()`/`pl-()` condicionais |
| `card.tsx`                  | `style={bodyStyle}` ×2                                           | `eslint-disable-next-line` — passthrough de API pública                                                                                                                                    |
| `dialog.tsx`                | `maxWidth: width`                                                | `--dialog-w` + `max-w-()`                                                                                                                                                                  |
| `input.tsx`                 | `style={inputStyle}`                                             | `eslint-disable-next-line` — passthrough de API pública                                                                                                                                    |
| `progress-bar.tsx`          | `left/width/height` thumb, `height` track, `width/minWidth` fill | `--thumb-x`+`left-()`, `--thumb-d`+`size-()`, `--track-h`+`h-()`, `--fill-w`+`w-()`, `--fill-min`+`min-w-()`                                                                               |
| `ring-chart.tsx`            | `width/height: size`, `left/top` chips                           | `--ring-d`+`size-()`, `--chip-x`/`--chip-y`+`left-()`/`top-()`                                                                                                                             |
| `tooltip.tsx`               | `height: stem`                                                   | `--stem-h` + `h-()`                                                                                                                                                                        |
| `wordmark.tsx`              | `gap`, `fontSize` ×2, `lineHeight`                               | `--wm-gap`+`gap-()`, `--wm-fs`+`text-(length:)`, `--wm-tag-fs`+`--wm-tag-lh`                                                                                                               |
| `showcase/fundamentos.tsx`  | `background/borderRadius/boxShadow: var(--t)`                    | `--swatch`+`bg-()`, `--r`+`rounded-()`, `--s`+`shadow-()`                                                                                                                                  |
| `templates/auth-layout.tsx` | `left/top: %`, `background: color`                               | `--node-x`/`--node-y`+`left-()`/`top-()`, `--node-c`+`bg-()`                                                                                                                               |

Sem mudança em `globals.css` — todas as vars são consumidas por utilitários arbitrários.

## T2 — peerDeps

`design-system/package.json`: `react`/`react-dom` saem de `dependencies` → `peerDependencies` `>=19` + `devDependencies` pinadas `19.3.0`. `pnpm install` regera o lockfile.

## T3 — Gate + verificação visual

1. `pnpm --filter @crm/design-system lint` → 0 warnings (`shadcn/no-inline-styles` zerado; `no-unknown-classes` valida as classes `-()` contra o Tailwind real).
2. `pnpm --filter @crm/design-system typecheck` + `test`.
3. `pnpm dev` → `/design-system` no chrome-devtools: avatar, bar-chart, card (plain+notched), progress-bar, ring-chart, tooltip, wordmark, fundamentos — medidas iguais (spot-check computed styles).
4. Gate completo: `format:check` + `typecheck` + `lint` + `test` + `build`.
5. TODO.md: marcar dívida como resolvida.

## Riscos

- `text-(length:--x)` pode não ser reconhecido pelo worker do `no-unknown-classes` → fallback: utility `text-lg` mantida + var consumida por regra `.bx-card-title` em globals (só se falhar).
- `pnpm install` pode re-resolver peers de novo (diff legítimo, revisar antes do commit).
