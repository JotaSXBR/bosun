---
version: alpha
name: BOSUN
description: >-
  Dark-first design system for BOSUN — a modular work environment on the web
  ("Seu mundo digital, sob comando."). Precise grids, tonal surfaces, one
  Verde sinal accent, notched module cards, hatch/dot data language.
  Normative token values for every Bosun UI; implemented in design-system/
  (package @crm/design-system). Dark is the default theme; keys prefixed `light-` are the
  [data-theme="light"] overrides.
colors:
  # Roles
  primary: "{colors.signal-400}"
  secondary: "{colors.ocean-700}"
  tertiary: "{colors.amber-500}"
  neutral: "{colors.abyss-900}"
  surface: "{colors.surface-card}"
  on-surface: "{colors.text-body}"
  error: "{colors.status-danger}"
  # Azul abissal / Azul oceano
  abyss-1000: "#050C15"
  abyss-950: "#08111D"
  abyss-900: "#0B1726"
  abyss-850: "#0F1E31"
  abyss-800: "#13253B"
  abyss-750: "#182C45"
  ocean-700: "#16324F"
  ocean-600: "#1E4266"
  ocean-500: "#2A5682"
  ocean-400: "#4A76A3"
  ocean-300: "#7FA2C6"
  ocean-200: "#B5CAE0"
  ocean-100: "#DCE6F0"
  # Verde sinal
  signal-50: "#F0FDFA"
  signal-100: "#CCFBF1"
  signal-200: "#99F6E4"
  signal-300: "#5EEAD4"
  signal-400: "#2DD4BF"
  signal-500: "#14B8A6"
  signal-600: "#0D9488"
  signal-700: "#0F766E"
  signal-800: "#115E59"
  signal-900: "#134E4A"
  # Branco névoa / Cinza aço
  white: "#FFFFFF"
  mist: "#F4F7FA"
  steel-100: "#E6ECF2"
  steel-200: "#CFD8E3"
  steel-300: "#A9B6C6"
  steel-400: "#8594A8"
  steel-500: "#64748B"
  steel-600: "#4B5A70"
  steel-700: "#364357"
  # Âmbar + status hues
  amber-300: "#FCD34D"
  amber-400: "#FBBF24"
  amber-500: "#F59E0B"
  amber-600: "#D97706"
  amber-700: "#B45309"
  green-400: "#4ADE80"
  green-600: "#16A34A"
  red-400: "#F87171"
  red-500: "#EF4444"
  red-600: "#DC2626"
  sky-400: "#60A5FA"
  sky-600: "#2563EB"
  # Semantic — dark (default, :root)
  bg-page: "{colors.abyss-900}"
  bg-sunken: "{colors.abyss-950}"
  surface-card: "{colors.abyss-850}"
  surface-raised: "{colors.abyss-800}"
  surface-raised-2: "{colors.abyss-750}"
  surface-control: "{colors.abyss-800}"
  surface-control-hover: "{colors.ocean-700}"
  surface-control-active: "{colors.ocean-600}"
  surface-inverse: "{colors.mist}"
  surface-accent: "{colors.signal-400}"
  surface-accent-hover: "{colors.signal-300}"
  surface-accent-soft: "rgba(45,212,191,.12)"
  surface-overlay: "rgba(5,12,21,.64)"
  text-strong: "{colors.mist}"
  text-body: "{colors.steel-100}"
  text-muted: "{colors.steel-400}"
  text-subtle: "{colors.steel-500}"
  text-accent: "{colors.signal-400}"
  text-on-accent: "{colors.abyss-900}"
  text-on-accent-muted: "{colors.signal-900}"
  text-inverse: "{colors.abyss-900}"
  text-disabled: "{colors.steel-600}"
  border-subtle: "rgba(244,247,250,.06)"
  border-default: "rgba(244,247,250,.10)"
  border-strong: "rgba(244,247,250,.18)"
  border-accent: "{colors.signal-400}"
  icon-default: "{colors.steel-300}"
  icon-strong: "{colors.mist}"
  icon-muted: "{colors.steel-500}"
  status-success: "{colors.green-400}"
  status-success-bg: "rgba(74,222,128,.12)"
  status-warning: "{colors.amber-500}"
  status-warning-bg: "rgba(245,158,11,.14)"
  status-danger: "{colors.red-400}"
  status-danger-bg: "rgba(248,113,113,.14)"
  status-info: "{colors.sky-400}"
  status-info-bg: "rgba(96,165,250,.14)"
  status-running: "{colors.signal-400}"
  status-running-bg: "rgba(45,212,191,.12)"
  data-1: "{colors.signal-400}"
  data-2: "{colors.mist}"
  data-3: "{colors.ocean-300}"
  data-4: "{colors.signal-700}"
  data-5: "{colors.amber-500}"
  data-track: "{colors.abyss-750}"
  pattern-ink: "rgba(244,247,250,.20)"
  pattern-ink-on-accent: "rgba(11,23,38,.38)"
  # Semantic — light ([data-theme="light"])
  light-bg-page: "{colors.mist}"
  light-bg-sunken: "#E9EEF4"
  light-surface-card: "{colors.white}"
  light-surface-raised: "#EEF2F7"
  light-surface-raised-2: "#E4EAF1"
  light-surface-control: "#EAEFF5"
  light-surface-control-hover: "#DCE4EE"
  light-surface-control-active: "#CFD8E3"
  light-surface-inverse: "{colors.abyss-900}"
  light-surface-accent: "{colors.signal-400}"
  light-surface-accent-hover: "{colors.signal-300}"
  light-surface-accent-soft: "rgba(13,148,136,.10)"
  light-surface-overlay: "rgba(11,23,38,.40)"
  light-text-strong: "{colors.abyss-900}"
  light-text-body: "#1E2B3C"
  light-text-muted: "{colors.steel-600}"
  light-text-subtle: "{colors.steel-500}"
  light-text-accent: "{colors.signal-700}"
  light-text-on-accent: "{colors.abyss-900}"
  light-text-on-accent-muted: "{colors.signal-900}"
  light-text-inverse: "{colors.mist}"
  light-text-disabled: "{colors.steel-300}"
  light-border-subtle: "rgba(11,23,38,.06)"
  light-border-default: "rgba(11,23,38,.10)"
  light-border-strong: "rgba(11,23,38,.20)"
  light-border-accent: "{colors.signal-600}"
  light-icon-default: "{colors.steel-600}"
  light-icon-strong: "{colors.abyss-900}"
  light-icon-muted: "{colors.steel-400}"
  light-status-success: "{colors.green-600}"
  light-status-success-bg: "rgba(22,163,74,.10)"
  light-status-warning: "{colors.amber-700}"
  light-status-warning-bg: "rgba(245,158,11,.14)"
  light-status-danger: "{colors.red-600}"
  light-status-danger-bg: "rgba(220,38,38,.08)"
  light-status-info: "{colors.sky-600}"
  light-status-info-bg: "rgba(37,99,235,.08)"
  light-status-running: "{colors.signal-700}"
  light-status-running-bg: "rgba(13,148,136,.10)"
  light-data-1: "{colors.signal-500}"
  light-data-2: "{colors.abyss-900}"
  light-data-3: "{colors.ocean-400}"
  light-data-4: "{colors.signal-800}"
  light-data-5: "{colors.amber-500}"
  light-data-track: "#E4EAF1"
  light-pattern-ink: "rgba(11,23,38,.18)"
  light-pattern-ink-on-accent: "rgba(11,23,38,.38)"
typography:
  display-xl:
    fontFamily: Manrope
    fontSize: 88px
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: -0.035em
  display:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -0.035em
  h1:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.02em
  page-title:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.03em
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.02em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h4:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.02em
  card-title:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: -0.005em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  micro:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.35
  eyebrow:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.12em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.7
  metric-xl:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: -0.035em
  metric:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: -0.035em
  metric-sm:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: -0.035em
  metric-unit:
    fontFamily: Manrope
    fontSize: 0.4em
    fontWeight: 400
    lineHeight: 1
  wordmark:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: 0.06em
rounded:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 24px
  2xl: 32px
  full: 999px
  card: 24px
  card-inner: 18px
  notch: 16px
spacing:
  base: 4px
  0-5: 2px
  1: 4px
  1-5: 6px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  7: 28px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  20: 80px
  24: 96px
  32: 128px
  gutter: 24px
  card-gap: 16px
  card-pad: 24px
  control-xs: 28px
  control-sm: 34px
  control-md: 42px
  control-lg: 50px
  icon-btn: 44px
  icon-sm: 16px
  icon-md: 20px
  icon-lg: 24px
  nav-height: 76px
  container-max: 1440px
  container-text: 680px
components:
  button-primary:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.text-on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 42px
    padding: 18px
  button-primary-hover:
    backgroundColor: "{colors.surface-accent-hover}"
    textColor: "{colors.text-on-accent}"
  button-secondary:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.text-strong}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 42px
    padding: 18px
  button-secondary-hover:
    backgroundColor: "{colors.surface-control-hover}"
    textColor: "{colors.text-strong}"
  button-secondary-active:
    backgroundColor: "{colors.surface-control-active}"
    textColor: "{colors.text-strong}"
  button-outline:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-accent}"
    rounded: "{rounded.full}"
  button-ghost:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.full}"
  button-inverse:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
  button-danger:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.status-danger}"
    rounded: "{rounded.full}"
  button-danger-hover:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.abyss-900}"
  icon-button:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.icon-default}"
    rounded: "{rounded.full}"
    size: 44px
  icon-button-accent:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.full}"
    size: 44px
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.card}"
    padding: 24px
  card-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.card-inner}"
  card-accent:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.card}"
    padding: 24px
  input:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 42px
    padding: 16px
  input-form:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.md}"
  select:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.text-strong}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 42px
  menu:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.md}"
    padding: 6px
  badge-neutral:
    backgroundColor: "{colors.surface-raised-2}"
    textColor: "{colors.text-body}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    height: 24px
  badge-solid:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.abyss-900}"
    rounded: "{rounded.full}"
  tag:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.text-strong}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 38px
  tag-selected:
    backgroundColor: "{colors.surface-accent-soft}"
    textColor: "{colors.text-accent}"
  module-nav-item:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.full}"
    height: 42px
  module-nav-item-active:
    backgroundColor: "{colors.surface-accent-soft}"
    textColor: "{colors.text-accent}"
  tabs-pill-active:
    backgroundColor: "{colors.surface-raised-2}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.full}"
    height: 32px
  dialog:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.xl}"
    width: 480px
  toast:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    width: 400px
  tooltip:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
    height: 26px
  switch-on:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.abyss-900}"
    rounded: "{rounded.full}"
  checkbox-checked:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.xs}"
    size: 18px
  avatar:
    backgroundColor: "{colors.ocean-700}"
    textColor: "{colors.ocean-100}"
    rounded: "{rounded.full}"
    size: 40px
  progress-bar:
    backgroundColor: "{colors.data-track}"
    textColor: "{colors.data-1}"
    rounded: "{rounded.full}"
    height: 12px
---

# BOSUN — DESIGN.md

The visual contract of this repository. **The YAML front matter above is the
normative source of every token** (Google Labs DESIGN.md format, `version:
alpha`). `design-system/src/styles/tokens/*.css` implements it and
`design-system/src/styles/tokens.test.ts` fails if the two drift. Change a
value here first, then in the CSS — never only in code.

## Overview

BOSUN ("boatswain" → _contramestre_) is a modular **work environment on the
web**: the user sets the course, the platform coordinates tools, activities
and integrations in one place. In this repository it is the identity of the
Bosun customer-operations platform (inbox, deals, integrations, AI agents).

- **Personality:** an experienced professional — calm, competent, objective,
  attentive. Technical but accessible, safe and transparent, organized but
  never bureaucratic, contemporary rather than sci-fi.
- **Direction — "precisão náutica":** precise grids and alignment, lines that
  connect points and modules, clean surfaces with clear hierarchy, consistent
  soft geometry, direction and movement used sparingly. It must read as a
  contemporary software platform, never as a naval product.
- **Dark-first.** The default theme is the night deck ("convés à noite"):
  Azul abissal page, tonal cards stepping up toward the viewer, one Verde
  sinal accent. A complete light theme exists for islands (marketing panels,
  showcase) and future use.
- **Density:** working UI is compact (14px interface text, 42px controls);
  marketing moments are generous (120–160px between site sections).

## Colors

Six brand colors, each with a job:

- **Azul abissal (#0B1726)** — the page. Cards step up tonally:
  `abyss-850` card → `abyss-800` raised/control → `abyss-750` raised-2.
- **Azul oceano (#16324F)** — hover/selected fill for tonal controls.
- **Verde sinal (#2DD4BF)** — the single accent: primary action, selection,
  live data, focus ring. Text on it is always Azul abissal.
- **Branco névoa (#F4F7FA)** — ink in the dark theme, page in the light theme,
  and the "inverse" disc for primary toolbar actions.
- **Cinza aço (#64748B)** — icons and meta only (≈3.5:1 on cards). Muted
  _text_ uses `steel-400` (`text-muted`).
- **Âmbar (#F59E0B)** — the only warning hue.

Status colors (`status-success|warning|danger|info|running`, each with a
10–14% alpha `-bg` tint) are semantic and never decorative; "running" is
Verde sinal and pulses. Data visualisation leads with signal, supports with
mist and ocean, flags with amber (`data-1…5`, `data-track`).

**Light theme** (`[data-theme="light"]`, keys `light-*`): mist page, white
cards, abyssal ink, darker signal (`signal-700`) for accent text. Components
need no overrides — they only consume semantic tokens.

Rules: always semantic tokens in components (`surface-*`, `text-*`,
`border-*`, `icon-*`, `status-*`, `data-*`); brand scales only when no
semantic token fits. Soft tints are 10–14% alpha of the hue. Borders are rare
hairlines (6–10% mist alpha); a 1px accent border marks the active nav pill,
the selected chip, the focused input and the selected flow card.

## Typography

- **Manrope** — brand and headings: 600 for page titles and h1–h3, 500 for
  h4 and card titles, **300 for big numbers and lead-ins**, 800 for the
  wordmark. Display tracking is tight (−0.035em), headings −0.02em.
- **Inter** — all interface text: 14px working size, 400/500; labels and
  compact controls 13px/500 (`label-sm`), button/tab large 15px (`label-lg`).
  `font-feature-settings: "cv11", "ss01"`.
- **JetBrains Mono** — IDs, logs (13/1.7, tabular), shortcuts, mono eyebrows
  (11px, +0.12em, uppercase).
- **Two-weight headline:** a Light, muted lead-in followed by a SemiBold
  payoff — "Seu mundo digital, **sob comando.**".
- **Metrics:** light (300), tabular figures; units at ~40% size in muted ink.
- Sentence case everywhere. The only all-caps text is the wordmark and mono
  eyebrows / column labels.

`page-title`, `label-lg`, `label-sm`, `mono`, `metric-unit` (units at 40% of
the figure) and the card-title / wordmark tracking are derived from the
component specs of the original export (raw values there); they are tokens
here (`tokens/extensions.css`) so no component hardcodes a size.

## Layout

- **4px base grid.** `spacing` keys `N` = N × 4px (Tailwind's default spacing
  scale is identical). 16px between cards (`card-gap`), 24px inside
  (`card-pad`), 8px between grouped controls.
- **Controls:** 28 / 34 / 42 / 50px heights (`control-xs|sm|md|lg`); icon
  buttons are 34 / 44 / 52px circles.
- **App shell:** 76px top bar — wordmark left · centered pill `ModuleNav` ·
  round actions right. Page header: 40px Manrope 600 title with underline
  tabs beside it, filters and one action right-aligned. 4-column card grid,
  16px gaps, max 1440px (`container-max`), 32px side padding. One accent card
  per row at most.
- **Site / marketing:** 1280px container, 120–160px vertical rhythm.
- Long text measures max 680px (`container-text`).

## Elevation & Depth

Depth is **tonal**: lighter surface = closer. Shadows are quiet.

| Token                  | Dark                                                                   | Use                                                            |
| ---------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `--shadow-card`        | inset 0 1px 0 rgba(244,247,250,.035)                                   | flat tiles (hairline highlight only)                           |
| `--shadow-control`     | inset 0 1px 0 rgba(244,247,250,.05), 0 1px 2px rgba(2,6,12,.40)        | tonal controls                                                 |
| `--shadow-raised`      | inset 0 1px 0 rgba(244,247,250,.05), 0 8px 24px -12px rgba(2,6,12,.55) | lifted rows, bubbles                                           |
| `--shadow-pop`         | 0 0 0 1px rgba(244,247,250,.07), 0 20px 48px -16px rgba(2,6,12,.75)    | menus, dialogs, toasts, command palette — only floating layers |
| `--shadow-glow`        | 0 0 0 4px rgba(45,212,191,.16), 0 0 22px rgba(45,212,191,.38)          | primary/accent hover                                           |
| `--focus-ring`         | 0 0 0 2px var(--bg-page), 0 0 0 4px var(--signal-400)                  | every focus-visible                                            |
| `--shadow-halo`        | 0 0 0 3px var(--surface-accent-soft)                                   | focused input/textarea (extension)                             |
| `--shadow-halo-danger` | 0 0 0 3px var(--status-danger-bg)                                      | focused input in error (extension)                             |
| `--shadow-bubble`      | 0 6px 18px -6px rgba(2,6,12,.5)                                        | tooltip bubble (extension)                                     |

Light theme swaps shadows to abyssal-ink alphas (see
`tokens/effects.css`). Extension tokens (`tokens/extensions.css`) come from
the original component specs; theme-dependent composites (`--focus-ring`,
halos) are re-declared on every theme scope so light/dark islands recompute
them. **Transparency & blur:** dialog and command-palette
scrims are `surface-overlay` + 10px backdrop blur (`--blur-overlay`); the
sticky site nav becomes 72% abyssal glass with 18px blur (`--blur-glass`).
Otherwise surfaces are opaque. No neumorphism beyond the hairline.

## Shapes

Soft-geometric. Cards 24 (`card`), nested cards 18 (`card-inner`), inputs
(form shape) and menus 14 (`md`), toasts 18 (`lg`), big site panels 32–40.
Buttons, chips, nav items, pill inputs and badges are **fully round**; icon
buttons are circles; checkboxes 6 (`xs`).

**The notched card — the signature.** A card is a flat tonal tile: no border,
no drop shadow, 24px radius. When it has actions, its top-right corner is
notched out: the title sits on a "tab" (radius 24/24/0/0), circular 44px
IconButtons sit in the cut 8px off the edges, a 16px concave fillet
(`notch`) joins tab to body (radius 0/24/24/24, padding 24). Nesting = a
lighter raised tile, never an outline.

**Textures with meaning** (`.bx-*` classes, `tokens/patterns.css`):
**hatch** (diagonal 1.5px @7px) = planned / remaining; **dots** = current /
in motion; **grid** (1px @48px) = precision backdrop for hero, login, empty
states and flow canvases. `.bx-on-accent` recolors them on accent fills.
**Connection motif:** dotted lines joining small round nodes = modules
working together — marketing, login and flow timelines only, never as
decoration inside work areas. No photos behind UI, no decorative gradients.

## Components

Implemented in `design-system/src/components/` (import
`@crm/design-system/components/<name>`); every component consumes only tokens and ships
default, hover, active, focus-visible, disabled and — where it applies —
loading, error, empty and selected states. Live specimens: `/design-system`
(dev only). Usage: `design-system/COMPONENTS.md`.

| Group      | Components                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Core       | `Icon`, `Button`, `IconButton`, `Badge`, `Tag`, `Avatar`, `Wordmark`                                 |
| Forms      | `Input`, `Select`, `Checkbox`, `Radio`, `Switch` (+ `Textarea`, `Label`, `Form` for react-hook-form) |
| Navigation | `ModuleNav`, `Tabs` (+ `DropdownMenu`)                                                               |
| Surfaces   | `Card`, `Accordion`, `Dialog`                                                                        |
| Feedback   | `Toast` (+ `Toaster`/`toast()`), `Tooltip`, `TooltipBubble`                                          |
| Data       | `Metric`, `ProgressBar`, `RingChart`, `BarChart`                                                     |
| Templates  | `AppTopBar`, `UserMenu`, `PageHeader`, `CommandPalette`, `EmptyState`, `AuthLayout`                  |

- **Button** — pill; `primary` (Verde sinal, **one per region**), `secondary`
  (tonal, default), `outline` (accent stroke), `ghost`, `inverse` (mist
  fill), `danger`; sizes 34/42/50; `loading` spins the loader icon. Press:
  1px down + scale .985.
- **IconButton** — circle; `control | inverse | accent | outline | ghost |
onAccent`; always labelled; optional Verde sinal notification dot. Press:
  scale .94.
- **Input** — pill (search, filters) or `rounded` (forms, radius 14); sunken
  fill; focus = accent border + 3px accent-soft halo; error = danger border +
  message replacing the hint.
- **Select** — pill trigger on control fill; menu on `surface-raised`,
  radius 14, `shadow-pop`; selected option in accent with a check.
- **Checkbox / Radio / Switch** — Verde sinal when on; Switch knob turns
  Azul abissal.
- **ModuleNav** — icon+label pills (42px); active = accent-soft fill + accent
  border + accent text; compact mode = 48px discs, active disc filled signal.
- **Tabs** — `underline` (page sections, 2px strong underline) or `pill`
  (segmented on control fill).
- **Card** — see Shapes; `tone`: default / raised / accent (max one per row)
  / sunken.
- **Dialog** — card surface, radius 24, `shadow-pop`, blurred scrim,
  360ms rise; Esc and scrim close.
- **Toast** — raised surface, radius 18, tone disc icon (running spins),
  bottom-right stack, 400px.
- **Tooltip** — pill bubble with a hairline "pin" stem; `inverse` default,
  `accent` for chart highlights.
- **Metric / ProgressBar / RingChart / BarChart** — light big numerals; solid
  = done/actual, **hatch = remaining/planned**, **dots = the focused/current
  column**.
- **Avatar** — initials on Azul oceano, photos forced to grayscale; Verde
  sinal ring = current user/owner; status dot online/busy/offline.
- **Wordmark** — "BOSUN" in Manrope 800, +6% tracking, optional tagline.
  **No logo exists yet** — never draw a symbol.

## Do's and Don'ts

- Do use exactly one primary (Verde sinal) action per view region and at most
  one accent card per row.
- Do consume semantic tokens; don't hardcode color, font, size, spacing,
  radius or shadow values in components or screens.
- Do keep depth tonal; don't add borders or drop shadows to cards.
- Do put the focus ring (`--focus-ring`) on every interactive element.
- Do write pt-BR copy, sentence case, short sentences with a clear verb.
- Don't use emoji, icon fonts, decorative gradients, photos behind UI,
  ship/sea stock imagery, anchors or helms as decoration.
- Don't use nautical vocabulary in routine UI ("Aye, capitão!", "Içar
  velas!", "Iceberg detectado!" are forbidden).
- Don't bounce, overshoot or parallax.
- Don't imply BOSUN replaces the computer's OS — it runs in the browser.

## Iconography

[Lucide](https://lucide.dev) line icons — 24px grid, **1.5px stroke**, round
caps and joins, no fills. 104 icons ship (lucide-static 0.469.0, ISC):
`design-system/assets/icons/*.svg` and embedded paths in
`design-system/src/lib/icon-paths.ts` for `<Icon name="…" />` (typed
`IconName`). Sizes: 16 in chips/inputs, 17–18 in buttons and nav pills, 20
default, 24+ in empty states. Color inherits `currentColor`; status icons
take the status hue. Icons often sit in circular discs (IconButton, 32–44px
decorative discs on `surface-raised`, Verde sinal for done/selected).
Module icons: Início `house` · Atendimento `inbox` · Negócios
`folder-kanban` · Integrações `plug` · Configurações `settings` · Automações
`workflow` · Indicadores `chart-no-axes-column` · Assist `sparkles`. Unicode
glyphs only inside mono logs (✓ ! ×) and `⌘K`. Existing `lucide-react` usages
get the 1.5 stroke globally until they migrate to `<Icon>`.

## Motion

Calm and precise. Easing `--ease-standard` cubic-bezier(.2,.7,.2,1)
(`--ease-enter` (0,0,.2,1), `--ease-exit` (.4,0,1,1)). Durations: 80ms
instant (press), 140ms color, 220ms most transitions, 360ms dialogs, 640ms
chart growth. Fades and short rises (8px). Running states pulse a dot or spin
the loader icon. Hover: tonal controls step up to Azul oceano, accent fills
lighten to `signal-300` and glow, ghost gains a control fill, rows lift to
`surface-raised`.

## Content & Voice

Interface copy is **Brazilian Portuguese**, uses **você** (never "tu", never
"o usuário"). BOSUN is "a BOSUN" (feminine, _a plataforma_) and says "nós"
only in brand/manifesto moments. One idea per sentence; periods on full
sentences ("Fluxo concluído."); no exclamation marks in product UI. Buttons
are verb-first, 1–3 words ("Salvar alterações", "Nova automação"); secondary
is usually "Cancelar". States say what happened, then what to do:

- Entrada: "Seu espaço de trabalho está pronto."
- Vazio: "Crie seu primeiro projeto para começar."
- Sucesso: "Fluxo concluído. Todas as etapas foram executadas."
- Erro: "Não foi possível conectar esta ferramenta. Revise as credenciais e
  tente novamente."
- Permissão: "Você decide quais informações esta integração pode acessar."

Menus use plain words (Início, Atendimento, Negócios, Integrações,
Configurações). Numbers use pt-BR formatting (99,1%, R$ 12,4k, 08:00).
Nautical vocabulary (rumo, destino, convés, sob comando) only in brand
moments — onboarding, login, campaigns. App strings live in
`apps/web/messages/pt-BR.json` (next-intl); library defaults are pt-BR and
overridable by props.

## Implementation

- **Where things live:** tokens `design-system/src/styles/tokens/*.css`
  (plain CSS, dark on `:root`, light on `[data-theme="light"]`); Tailwind
  entry `design-system/src/styles/globals.css` (`@crm/design-system/globals.css`);
  library map `design-system/README.md`; visual references
  `design-system/reference/` (open `index.html`).
- **Theme:** `<html data-theme="dark">`; any subtree can be an island with
  `data-theme="light"` or `data-theme="dark"`. The app is dark-only for now.
- **Fonts:** `next/font/google` (Manrope, Inter, JetBrains Mono) exposes
  `--font-manrope|inter|jetbrains-mono` on `<html>`; the tokens fall back to
  the self-hosted woff2 in `design-system/assets/fonts/` (used by the
  reference HTMLs).
- **Tailwind vocabulary** (utilities are the only way code touches tokens):

| Utility key                                  | Token                          | Utility key                                         | Token                           |
| -------------------------------------------- | ------------------------------ | --------------------------------------------------- | ------------------------------- |
| `page`, `sunken`                             | `bg-page`, `bg-sunken`         | `ink-strong`, `ink`, `ink-muted`, `ink-subtle`      | `text-strong/body/muted/subtle` |
| `surface`, `raised`, `raised-2`              | `surface-card/raised/raised-2` | `ink-accent`, `ink-inverse`, `ink-disabled`         | `text-accent/inverse/disabled`  |
| `control`, `control-hover`, `control-active` | `surface-control*`             | `ink-on-signal`, `ink-on-signal-muted`              | `text-on-accent*`               |
| `signal`, `signal-hover`, `signal-soft`      | `surface-accent*`              | `line-subtle`, `line`, `line-strong`, `line-accent` | `border-*`                      |
| `inverse`, `overlay`                         | `surface-inverse/overlay`      | `icon`, `icon-strong`, `icon-muted`                 | `icon-*`                        |
| `success … running` (+ `-soft`)              | `status-*` (+ `-bg`)           | `data-1…5`, `data-track`                            | `data-*`                        |

Type: `font-display|sans|mono`, `text-display-xl|display|page-title|h1…h4|lg|md|sm|ui|ui-lg|xs|2xs|metric-xl|metric|metric-sm`,
`tracking-display|heading|title|ui|eyebrow`. Shape: `rounded-xs…2xl|pill|card|card-inner|notch`.
Layout: Tailwind spacing (4px), `h-control-*`, `size-icon-btn`, `h-nav`,
`p-card-pad`, `gap-card-gap`, `max-w-page`, `max-w-text`. Effects:
`shadow-control|card|raised|pop|glow|focus`, `ease-standard|enter|exit`,
`duration-instant|fast|base|slow|chart`, `backdrop-blur-overlay|glass`.

- **Enforcement:** `@shadcn/lint` (token rules as errors) + the design-system
  adherence rules (`tooling/eslint/design-system.js`, translated from the
  export's `_adherence` config). See `docs/development/design-system-lint.md`.
