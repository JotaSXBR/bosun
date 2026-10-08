# Implementation Plan: i18n — next-intl + extração PT-BR

## Overview

Adotar `next-intl` como camada de i18n com locale fixo `pt-BR` (sem
segmento `[locale]` na rota) e extrair todas as strings user-facing
hardcoded de `apps/web/src` para `messages/pt-BR.json`, cumprindo
`docs/product/rules.md`: um segundo locale vira um arquivo de
tradução, não um refactor.

## Architecture Decisions

- **`next-intl@4.14.9`** — peer declara Next 16 + React 19; única dep
  nova. Plugin `createNextIntlPlugin` em `next.config.ts`.
- **Sem `[locale]` segment** — app mono-locale; `i18n/request.ts`
  retorna `locale: "pt-BR"` fixo + catálogo. Locale por usuário/org é
  decisão futura e não exige refactor das chamadas `t()`.
- **Catálogo único `apps/web/messages/pt-BR.json`** com namespaces por
  feature: `common`, `auth`, `nav`, `dashboard`, `inbox`, `composer`,
  `leads`, `integrations`, `settings`, `onboarding`, `widget`.
  `common` só para termos realmente compartilhados (Salvar, Cancelar,
  Excluir, Erro, Carregando...).
- **Server → `getTranslations(ns)`; client → `useTranslations(ns)`**;
  `metadata` via `getTranslations` em `generateMetadata`. Provider no
  root layout (`NextIntlClientProvider` herda locale+messages do
  request config no App Router).
- **Datas**: trocar `toLocaleString("pt-BR")` literal por
  `useFormatter()`/`getFormatter()` nos componentes já tocados —
  mantém a promessa "segundo locale = arquivo" para datas também.
- **Fora de escopo**: strings de erro retornadas por
  `packages/core`/server actions (precisam de error codes — slice
  próprio, registrar no TODO); `public/widget.js` (pendência já
  listada); `packages/ui` (primitivos sem texto).
- **Zod schemas em client forms**: mensagens PT dentro de `.ts` de
  form — o schema recebe `t` ou a mensagem fica no map de erro do
  componente; decidir caso a caso, preferindo extrair a string para o
  namespace da página.

## Task List

### Phase 1 — Infra + piloto

- [ ] Task 1: setup next-intl + catálogo + provider + piloto (auth)

### Phase 2 — Extração por área

- [ ] Task 2: entry points — onboarding, setup, dashboard, nav/sign-out
- [ ] Task 3: inbox/messaging — páginas + composer + message-item +
      extras + presence + voice-recorder + ticket-actions + reactions
- [ ] Task 4: leads/kanban — deals page, kanban-*, dialogs, labels,
      conversation-lead-panel
- [ ] Task 5: integrations + settings — conexões, widget panel,
      settings, platform, teams

### Phase 3 — Fechamento

- [ ] Task 6: sweep residual + datas via formatter + e2e smoke + docs

### Checkpoints

- Após T1: app renderiza com provider; piloto (sign-in) visual ok.
- Após T5: `grep` residual ≈ 0 literais PT user-facing em `src/`.
- Após T6: gate verde + e2e site-chat + TODO/docs atualizados.

## Risks and Mitigations

| Risk                                                | Impact | Mitigation                                                      |
| --------------------------------------------------- | ------ | --------------------------------------------------------------- |
| String extraída muda texto renderizado → e2e quebra | Med    | e2e smoke no checkpoint final; extração preserva texto verbatim |
| Server action error strings em PT ficam fora        | Baixo  | decisão registrada no brief/TODO — slice próprio de error codes |
| `useFormatter` em componente sem provider próximo   | Baixo  | provider único no root layout cobre tudo                        |
| Zod messages em client schemas                      | Baixo  | extrair mensagem para o call-site, schema tipa só shape         |

## Open Questions

- Locale por org/usuário no futuro → fora; documentar no TODO.
