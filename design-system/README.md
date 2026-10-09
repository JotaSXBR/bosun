# design-system — BOSUN (`@crm/ui`)

> **Seu mundo digital, sob comando.**
> Você define o rumo. BOSUN organiza a operação.

The brand's design system, ported from a Claude Design export (2026-10-08)
into the app's real stack (Next 16, React 19, Tailwind 4, Radix). Package name
stays `@crm/ui` (it lived in `packages/ui` before — ADR 0017). The visual
contract and the normative token values are in [`/DESIGN.md`](../DESIGN.md);
this file is the map.

## Map

| Path                           | What it holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/styles/tokens/*.css`      | Canonical tokens, plain CSS. `colors.css` (scales + semantic, dark on `:root`, light on `[data-theme="light"]`), `typography.css`, `spacing.css` (4px grid, radii, control sizes, layout), `effects.css` (shadows, focus, easing, durations, blur), `patterns.css` (`.bx-hatch`, `.bx-hatch-h`, `.bx-dots`, `.bx-grid`, `.bx-on-accent`), `base.css` (element defaults), `fonts.css` (`@font-face` for the reference HTMLs; the app uses `next/font`), `extensions.css` (sizes/shadows the component specs had as raw px + per-theme composites) |
| `src/styles/tokens.test.ts`    | Drift test: `DESIGN.md` front matter ↔ token CSS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/styles/globals.css`       | Tailwind entry (`@crm/ui/globals.css`): imports tokens, maps them to utilities (`@theme inline`), theme variants, showcase state variants                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/components/*.tsx`         | The components (`@crm/ui/components/<name>`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/templates/*.tsx`          | Composition patterns from the webapp UI kit (`@crm/ui/templates/<name>`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/showcase/`                | The whole library, every state, dark + light (`@crm/ui/showcase`, served at `/design-system` in dev)                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/lib/`                     | `utils.ts` (`cn`), `icon-paths.ts` (104 Lucide paths, typed `IconName`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `assets/icons/*.svg`           | 104 Lucide SVGs (lucide-static 0.469.0, ISC)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `assets/fonts/*.woff2`         | Manrope, Inter (+italic), JetBrains Mono — variable, latin + latin-ext (SIL OFL)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `reference/`                   | Standalone HTML references (see below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lint/adherence.oxlintrc.json` | The export's original adherence config, kept for provenance — active rules live in `tooling/eslint/design-system.js`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `COMPONENTS.md`                | Usage of each component and template (API, variants, when to use)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Components

| Group      | File (`src/components/`)                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Core       | `icon`, `button`, `icon-button`, `badge`, `tag`, `avatar`, `wordmark`                                |
| Forms      | `input`, `select`, `checkbox`, `radio`, `switch`, plus `textarea`, `label`, `form` (react-hook-form) |
| Navigation | `module-nav`, `tabs`, plus `dropdown-menu`                                                           |
| Surfaces   | `card`, `accordion`, `dialog`                                                                        |
| Feedback   | `toast` (`Toast`, `Toaster`, `toast()`), `tooltip` (`Tooltip`, `TooltipBubble`)                      |
| Data       | `metric`, `progress-bar`, `ring-chart`, `bar-chart`                                                  |

The 24 components of the export are all here with the export's API (props,
variants, defaults), Radix underneath where behavior matters. `textarea`,
`label`, `form` and `dropdown-menu` predate the export (shadcn) and were
restyled; they have no export equivalent.

Templates (`src/templates/`): `app-top-bar`, `user-menu`, `page-header`,
`command-palette` (+ `useCommandShortcut`), `empty-state`, `auth-layout` —
ported from `reference/ui_kits/webapp` (shell + login) and used by the app
shell (`apps/web/src/components/app-shell.tsx`) and the sign-in/sign-up/
onboarding screens.

## Reference HTMLs

`reference/` mirrors the export's relative layout, so every page renders on
its own — open `reference/index.html` straight from disk (`file://`) or from
any static server. Pages load tokens from `../src/styles/tokens/` and fonts
from `../assets/fonts/`; component cards and UI kits use `_ds_bundle.js` (the
export's compiled component bundle) plus React/Babel from unpkg, so those
need network access. The UI kits' JSX is inlined in each `index.html`
(`<script type="text/babel" data-source="<file>.jsx">`) because browsers
block Babel's XHR for external `.jsx` files under `file://`. The pages are
kept verbatim otherwise — including the export's own quirks (e.g. the
double focus ring on the kit's search input, fixed in the ported `Input`).

- `guidelines/*.html` — foundation specimens (colors, type, spacing, radii,
  elevation, motion, brand, iconography).
- `components/<group>/<group>.card.html` — component specimens.
- `ui_kits/webapp/` — click-through app (login, Início, Tarefas, Automações,
  Integrações, Documentos vazio, ⌘K); `ui_kits/website/` — landing page.
  Reference compositions, not specs.

## Creating a component inside the system

1. Check `COMPONENTS.md` and the showcase — extend an existing component
   before adding one.
2. Add `src/components/<kebab>.tsx`: named export, typed props, Radix
   primitive underneath when behavior is non-trivial, `cva` variants, only the
   Tailwind vocabulary from `globals.css` (table in DESIGN.md →
   Implementation). No hex, px, arbitrary values or inline styles (dynamic
   numeric geometry is the only exception).
3. Cover default, hover, active, focus-visible (`shadow-focus`), disabled and
   — where they apply — loading, error, empty, selected. Spread rest props on
   the interactive root so `data-preview="hover|active|focus"` works.
4. Add a section to `src/showcase/` and the usage to `COMPONENTS.md`. The
   prop/variant contract is the TS type (strict typecheck replaces the
   export's per-prop allowlists); `tooling/eslint/design-system.js` covers
   raw hex/px, non-DS fonts and imports of DS internals.
5. Need a new token? Add it to `DESIGN.md` first, then the tokens CSS and the
   `@theme inline` block — `tokens.test.ts` keeps them honest.

## Sources

| Source                                                        | What it gave                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand brief ("BOSUN — Seu mundo digital, sob comando.")       | Concept, positioning, pillars, voice & microcopy, palette (6 colors), fonts, logo concept (not drawn — use `Wordmark`), module architecture, hero copy, manifesto                                                                                                                                                                |
| Behance-style case study of an unrelated product ("Stockify") | **Visual UI reference only**: notched cards with corner action discs, pill module nav, hatched/dotted capsule charts, light big numerals, two-weight headlines, accent footer, monochrome photography — re-skinned in the BOSUN palette. Its name, logo, lime color, typeface and images were not used and are not in this repo. |

No logo file, Figma file or BOSUN product screenshots existed; everything is
a first implementation of the brief.
