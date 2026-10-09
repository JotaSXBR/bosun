# BOSUN — Webapp UI kit

Click-through recreation of the BOSUN work environment ("Área de trabalho"), built entirely from the design-system components.

**Status:** BOSUN has no shipped product yet. These screens are the *reference implementation* of the brand brief, using the UI language of the supplied visual reference (dark modular dashboard, notched cards, pill navigation, hatched/dotted data). Module scope follows the brief's suggested architecture — confirm against the real launch scope before treating any screen as spec.

## Screens
| File | Screen | Interactions |
|---|---|---|
| `login.jsx` block (`data-source`) in index.html | Entrar | password show/hide, error state (<4 chars), loading → lands on Início with "Seu espaço de trabalho está pronto." |
| `home.jsx` block (`data-source`) in index.html | Início | tabs swap data (Esta semana / Hoje), removable filter chips, bar hover, accordion, arrows navigate |
| `tasks.jsx` block (`data-source`) in index.html | Tarefas | tab filters, search, project filter (card or Select), check to complete (toast) |
| `flows.jsx` block (`data-source`) in index.html | Automações | select flow, toggle on/off, **Executar agora** animates steps + appends log + success toast |
| `connect.jsx` block (`data-source`) in index.html | Integrações | search, "+" opens permission Dialog (Radio + Checkbox) → connected; ERP card shows the error toast |
| `app.jsx` block (`data-source`) in index.html | Router | Documentos = empty state; ⌘K / search icon = command palette; avatar menu → Sair |
| `shell.jsx` block (`data-source`) in index.html | TopBar, PageHeader, CommandPalette, ToastHost, EmptyState | — |

## Layout rules used
- Top bar 76px: wordmark left · ModuleNav centered · search / bell / avatar right.
- Page header: 40px Manrope 600 title, underline Tabs beside it, filters + one action right-aligned.
- 4-column card grid, 16px gaps, max 1440px, 32px side padding. One accent card per row.
