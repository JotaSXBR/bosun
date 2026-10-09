# 0017: Design system BOSUN — `design-system/` + DESIGN.md

Status: accepted (supersedes the provisional theme — black/orange, radius 0,
Chakra Petch — recorded in TODO.md on 2026-10-07)

## Context

The brand design system arrived as a raw Claude Design export
(`design-system-export/`): tokens CSS, self-hosted fonts, 104 Lucide SVGs, 24
inline-styled React components (JSX + `.d.ts` + usage prompts), foundation
specimen HTMLs, two UI kits (webapp, website), an oxlint adherence config and
tool artifacts (compiled bundle, manifest, thumbnails, 29 third-party
reference images). The app already had shadcn primitives in `packages/ui`
(`@crm/ui`, ~120 imports in `apps/web`), `@shadcn/lint` token rules as errors,
and a provisional dark theme. Decisions taken with the repo owner on
2026-10-08.

## Decision

- **Location:** `git mv packages/ui design-system`, keeping the package name
  `@crm/ui` (no import churn, history preserved). Tokens, fonts, icons,
  templates, showcase and the standalone reference HTMLs live there too —
  one library.
- **Source of truth:** `DESIGN.md` at the repo root (Google Labs DESIGN.md
  format, `alpha`) holds the normative tokens; `design-system/src/styles/tokens/*.css`
  implements them (plain CSS, also consumed by the reference HTMLs) and a unit
  test fails on drift.
- **One API per component — the design system's.** Where shadcn and the DS
  overlapped (Button, Badge, Card, Dialog, Input, Select, Toast/Sonner) the DS
  props API wins and every call site migrates; Radix stays underneath where it
  provides behavior (Dialog, Select, Checkbox, Radio, Switch, Tabs, Accordion,
  Tooltip, DropdownMenu); Sonner stays only as the toast engine behind
  `toast()`. Components without a DS equivalent (DropdownMenu, Form, Label,
  Textarea) are kept and restyled.
- **Tailwind vocabulary disjoint from shadcn's** (`bg-surface`,
  `text-ink-muted`, `border-line`, `bg-signal`…) so any leftover legacy class
  becomes an `no-unknown-classes` lint error; non-DS Tailwind defaults for
  type size, radius and shadow are reset.
- **Theme:** dark on `:root`, `<html data-theme="dark">`, light islands via
  `[data-theme="light"]`. App stays dark-only; the showcase renders both.
- **Fonts:** `next/font/google` (Manrope, Inter, JetBrains Mono); tokens fall
  back to the self-hosted woff2 for the reference HTMLs.
- **Showcase:** `/design-system`, development only (`notFound()` in
  production).
- **Lint:** the export's adherence config is translated to ESLint
  (`tooling/eslint/design-system.js`), original kept at
  `design-system/lint/adherence.oxlintrc.json` for provenance.

## Consequences

- Every existing screen restyles through tokens; new UI must come from
  `@crm/ui` and can't hardcode color/font/size/spacing/radius (lint).
- Large one-time diff in `apps/web` (call-site migration to the DS API).
- The package name (`@crm/ui`) no longer matches its folder
  (`design-system/`) — tracked as a minimum-priority TODO (rename to
  `@crm/design-system` for auditability).
- `lucide-react` icons remain in app code (stroke aligned to 1.5 globally)
  until they migrate to `<Icon>`; the DS ships only 104 icons.
- Library default strings are pt-BR (the brand is pt-BR-only), overridable
  by props; app strings stay in next-intl messages.

## Alternatives considered

- **New `@crm/design-system` package, migrate imports** — better audit trail,
  more churn now; deferred (TODO, minimum priority).
- **Keep shadcn's compound APIs and only restyle** — less churn, but two
  vocabularies and adherence rules that don't match the DS contract.
- **Port the export literally** (inline styles, JS hover state) — loses Radix
  accessibility and fights the Tailwind/lint toolchain.
- **Self-host fonts with `next/font/local`** — per-file unicode-range isn't
  expressible there; `next/font/google` already self-hosts at build time and
  is the existing convention.
