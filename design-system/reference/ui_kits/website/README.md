# BOSUN — Website UI kit

Single-page marketing site for BOSUN, assembled from the design-system components plus a few site-only sections.

**Status:** no existing BOSUN site was supplied. Structure follows the visual reference's landing-page pattern (hero → statement → light feature panel → FAQ → accent footer) with copy taken verbatim from the brand brief (hero, apresentação curta, pilares, manifesto). Treat as a reference composition, not a spec.

## Sections
| Component (`hero.jsx` / `sections.jsx` blocks (`data-source`) in index.html) | Notes |
|---|---|
| `SiteNav` | sticky; turns into blurred Azul abissal glass after 24px scroll |
| `SiteHero` | eyebrow, 88px two-weight headline, CTAs "Começar agora" / "Conhecer a plataforma", live product preview built from real components over `.bx-grid` |
| `SiteIdea` | brand idea statement + "apresentação curta" |
| `SiteModules` | `data-theme="light"` panel; clicking a module swaps the dark-island preview |
| `SitePillars` | five pillars as cards, first one accent |
| `SiteManifesto` | alternating Light / SemiBold lines, ends on wordmark + signature |
| `SiteFaq` | Accordion; answers the "is it an OS?" positioning question |
| `SiteFooter` | Verde sinal block, 40px radius, link columns |

Shared helpers: `SiteEyebrow` (dot + label), `SiteTwoWeight` (Light lead-in + SemiBold payoff headline).
