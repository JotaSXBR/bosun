# COMPONENTS.md

Usage reference for the BOSUN design-system library (`@crm/design-system`). Tokens are
defined in [`DESIGN.md`](../DESIGN.md) (source of truth) — see it before
reaching for any value. Live examples of every variant and state:
`/design-system` (dev only).

Components import via `@crm/design-system/components/<kebab>`; composed app blocks via
`@crm/design-system/templates/<kebab>`; utilities via `@crm/design-system/lib/utils` (`cn`).

Conventions: props listed below are the component's own API — all components
also accept `className` and the native attributes of their root element
(`...props` spread on it, `data-preview="hover|active|focus"` forces states in
the showcase). Icon props take `IconName` (the 104-icon set — see the Fundamentos
section of the showcase). pt-BR defaults can be overridden per prop. Radix
`Select` forbids `""` as a value — use a sentinel like `"all"`.

## Components

### `Icon` — `@crm/design-system/components/icon`

SVG icon (24×24 grid, `currentColor`, round caps).
Use for any icon; never inline SVGs or other icon packs in product UI.
Props: `name: IconName` · `size?: number` (20) · `strokeWidth?: number` (1.5) ·
`color?: string` · `title?: string` (accessible name; without it the icon is
`aria-hidden`).

### `Button` — `@crm/design-system/components/button`

Actions. `variant`: `primary` (main action) · `secondary` (default) ·
`outline` · `ghost` · `inverse` (on dark imagery) · `danger` (destructive).
`size`: `sm` · `md` · `lg` (control heights). `iconLeft`/`iconRight`,
`loading` (spinner + `aria-busy`), `fullWidth`, `type` (`"button"`),
`asChild` (Radix Slot — e.g. wrap a `Link`). Icon-only actions use
`IconButton` instead.

### `IconButton` — `@crm/design-system/components/icon-button`

Icon-only action. Props: `icon: IconName` · `label: string` (required —
aria-label + tooltip) · `variant`: `control` · `inverse` · `accent` ·
`outline` · `ghost` · `onAccent` · `size`: `sm` 34 / `md` 44 / `lg` 52 ·
`dot?: boolean` (notification dot).

### `Badge` — `@crm/design-system/components/badge`

Status/category chip. `tone`: `neutral` (default) · `accent` · `success` ·
`warning` · `danger` · `info` · `running` (animated). `variant`: `soft`
(default) · `solid`. `icon`, `dot` (pulses when `running`), `size`: `sm`/`md`.
Not interactive — for clickable chips use `Tag`.

### `Tag` — `@crm/design-system/components/tag`

Filter/facet chip. `icon`, `selected`, `onRemove` (renders the × affordance,
`removeLabel`), `onClick` (button + `aria-pressed`), `size`: `sm`/`md`.

### `Avatar` — `@crm/design-system/components/avatar`

`src` (rendered grayscale) or `name` (initials/alt). `size`: `xs`/`sm`/`md`/
`lg`/`xl` or a px number. `ring` (Verde sinal — current user), `status`:
`online`/`busy`/`offline`.

### `Wordmark` — `@crm/design-system/components/wordmark`

The brand. `size`: `sm`/`md`/`lg`/`xl` or px · `tone`: `default`/`light`/
`dark`/`accent` · `tagline?: boolean`. Never draw a logo symbol.

### `Input` — `@crm/design-system/components/input`

`label`, `hint`, `error` (wires `aria-invalid`/`aria-describedby`), `icon`,
`trailing` (ReactNode — e.g. the password eye `IconButton`), `size`: `sm`/`md`/
`lg`, `shape`: `pill` (default — search/filters) | `rounded` (form fields),
`inputStyle`. `className`/`style` go to the wrapper; input attrs (incl. `ref`,
`id`, RHF `{...field}`) go to the `<input>`.

### `Select` — `@crm/design-system/components/select`

Single-choice dropdown (Radix). `options: Array<string | {value, label, disabled?}>`,
`value`/`defaultValue`/`onChange`, `placeholder` ("Selecionar"), `label`,
`icon`, `size`: `sm`/`md`, `hint`, `error`, `disabled`, `name`, `required`, `id`.
Values must be non-empty strings.

### `Checkbox` — `@crm/design-system/components/checkbox`

`checked`/`defaultChecked`/`indeterminate`, `onChange(checked: boolean)`,
`label`, `description`, `disabled`, `name`, `id`, `required`.

### `Radio` — `@crm/design-system/components/radio`

`options: Array<string | {value, label, description}>`, `value`/`defaultValue`/
`onChange`, `name` (group aria-label AND posted field name), `direction`:
`row`/`column`, `disabled`.

### `Switch` — `@crm/design-system/components/switch`

`checked`/`defaultChecked`/`onChange`, `label`, `description`,
`size`: `sm`/`md`, `disabled`, `name`, `id`.

### `ModuleNav` — `@crm/design-system/components/module-nav`

Primary navigation. `items: {id, label, icon?, badge?, href?}[]`,
`value`/`defaultValue`/`onChange`, `compact` (icon discs), `linkComponent`
(default `"a"`; pass `next/link`'s `Link`). Active item gets
`aria-current="page"`.

### `Tabs` — `@crm/design-system/components/tabs`

`items: Array<string | {value, label, count}>`, `value`/`defaultValue`/
`onChange`, `variant`: `underline` (page sections) | `pill` (segmented).

### `Card` — `@crm/design-system/components/card`

Surface container. `title`, `subtitle`, `icon`, `actions` (triggers the
header notch), `tone`: `default`/`raised`/`accent`/`sunken`, `padding`,
`radius`, `notchGap`, `fillet`, `titleSize` (numeric overrides; `undefined` =
token), `bodyClassName`, `bodyStyle`, `onClick` (makes it keyboard-operable).
Numeric props are optional; defaults come from tokens (`--card-pad`,
`--radius-card`, `--radius-notch`).

### `Accordion` — `@crm/design-system/components/accordion`

`items: {id, title, meta?, content}[]`, `defaultOpen` (first item), `multiple`.
Open item elevates to a raised card.

### `Dialog` — `@crm/design-system/components/dialog`

Modal. `open`, `onClose` (Esc/scrim), `title`, `description`, `icon`,
`footer`, `width` (px, 480), `closeLabel` ("Fechar"). Without `title` a
visually-hidden one is rendered. Submit buttons in `footer` outside the form
need `form="<id>"`.

### `Toast`, `Toaster`, `toast` — `@crm/design-system/components/toast`

`Toast` (presentational): `tone`: `success`/`warning`/`danger`/`info`/
`running` · `title` · `description` · `action` (ReactNode) · `onClose` ·
`dismissLabel`. `Toaster` is the mounted host (once, in the root layout).
Imperative: `toast({tone,title,description,action,duration})`,
`toast.success|error|warning|info|running(title, opts)`,
`toast.dismiss(id?)`.

### `Tooltip`, `TooltipBubble` — `@crm/design-system/components/tooltip`

`Tooltip`: `content`, `children` (trigger), `tone`: `inverse`/`accent`/
`default`, `placement`: `top`/`bottom`, `open`. `TooltipBubble` renders the
bubble alone (`stem` px, `placement`).

### `Metric` — `@crm/design-system/components/metric`

`value`, `prefix`/`suffix` (units, `text-unit`), `label`, `delta` +
`deltaTone`/`deltaIcon`, `size`: `sm`/`md`/`lg`, `onAccent`.

### `ProgressBar` — `@crm/design-system/components/progress-bar`

`value`, `max` (100), `size`: `sm`/`md`/`lg` or px, `tone`: `accent`/
`success`/`warning`/`danger`, `pattern` (hatched track), `thumb` (glow knob),
`labels`, `label`, `valueLabel`. `role="progressbar"` + aria values.

### `RingChart` — `@crm/design-system/components/ring-chart`

Segmented donut. `segments: {value, color?, label?, display?}[]`,
`size` (140), `thickness` (18), `gap` (14), `showValues` (chips at each
segment start), `children` = center content. Colors default to
`var(--data-1…4)`.

### `BarChart` — `@crm/design-system/components/bar-chart`

`data: {label, value, target?}[]`, `height` (220), `highlight`/
`defaultHighlight`/`onHighlight`, `formatValue`, `maxBarWidth` (72).

## Kept primitives (re-styled, API unchanged)

- `Label`, `Textarea` — form labels/fields; Textarea matches `Input
shape="rounded"` styling.
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`,
  `FormDescription` — react-hook-form wiring (`@crm/design-system/components/form`).
- `DropdownMenu*` — Radix menu family (`@crm/design-system/components/dropdown-menu`).

## Templates — `@crm/design-system/templates/<kebab>`

### `AppTopBar`

`brand` (`<Wordmark size={20}/>`), `modules: ModuleNavItem[]`, `active`,
`onModuleChange`, `linkComponent`, `actions` (right side — IconButtons +
`UserMenu`), `className`. Full nav at `lg`, compact discs below.

### `UserMenu`

`name`, `email`, `src`, `items: {icon, label, href?, onSelect?}[]`,
`linkComponent`, `label` ("Conta"). Avatar trigger; rings while open.

### `PageHeader`

`title` (ReactNode — display-size `h1`), `tabs`/`tab`/`onTab`, `filters` +
`onRemoveFilter` (Tags), `right` (actions), `className`.

### `CommandPalette`, `useCommandShortcut`

`open`, `onOpenChange`, `groups: {label, items: {id, icon, label, keywords?,
onSelect}[]}[]`, `placeholder`, `emptyLabel(q)`, `title` (sr-only). NFD-insensitive
filtering, ↑↓/Enter/Esc, combobox/listbox ARIA. `useCommandShortcut(onOpen)`
binds Ctrl/⌘+K.

### `EmptyState`

`icon`, `title`, `body`, `action`, `className`. Grid-pattern (`bx-grid`) card
with the 64px icon disc — for empty lists and zero-results states.

### `AuthLayout`

`children` (the form), `lead`/`payoff` (brand headline), `nodes` (4 labels on
the motif). Two columns at `lg`; brand panel hidden below.
