# Tasks — i18n next-intl PT-BR

## Task 1: Infra + piloto auth

**Description:** Instalar `next-intl@4.14.9`, criar
`src/i18n/request.ts` (locale pt-BR fixo + `messages/pt-BR.json`),
`createNextIntlPlugin` no `next.config.ts`, `NextIntlClientProvider`
no root layout, e extrair `sign-in`/`sign-up` como piloto do padrão
(server `getTranslations` + client `useTranslations`).

**Acceptance criteria:**

- [ ] App compila e renderiza `/sign-in` idêntico (visual PT-BR)
- [ ] Strings do piloto vivem no catálogo, não no JSX

**Verification:** `pnpm build` ou dev + check visual Chrome DevTools.

**Files:** `apps/web/package.json`, `next.config.ts`,
`src/i18n/request.ts`, `messages/pt-BR.json`, `src/app/layout.tsx`,
`src/app/sign-in/*`, `src/app/sign-up/*`

## Task 2: Entry points

**Description:** Extrair onboarding, setup-form, dashboard
(`app/page.tsx`), navegação/sign-out e strings compartilhadas
(`common`).

**Acceptance criteria:**

- [ ] Páginas renderizam idênticas; strings no catálogo

## Task 3: Inbox/messaging

**Description:** Extrair `inbox/page`, `inbox/[id]/page`,
`inbox-live`, `message-item`, `message-extras`, `composer`,
`presence-indicator`, `voice-recorder`, `ticket-actions`,
`reaction-chips`. Datas → `useFormatter()`/`getFormatter()`.

**Acceptance criteria:**

- [ ] Thread renderiza idêntica; formatação de data mantém pt-BR

## Task 4: Leads/kanban

**Description:** Extrair `deals/page`, `kanban-*`, `deal-card`,
`deal-dialogs`, `funnel-dialogs`, `label-picker`,
`new-funnel-button`, `conversation-lead-panel`.

## Task 5: Integrations + settings

**Description:** Extrair `integrations/*` (page, new-connection-form,
connection-actions, connection-health, pairing-panel, widget-panel,
copy-button) e `settings/*` (page, settings-form, platform-settings,
teams-manager).

## Task 6: Sweep + docs

**Description:** Grep residual de literais PT em `src/` (aria-labels,
titles, metadata, lib), corrigir restos, e2e `site-chat.spec` +
`settings.spec`/`deals.spec` smoke, atualizar `TODO.md` (entregue +
pendências: error strings de server actions, widget.js) e
`docs/product/rules.md` se necessário.

**Acceptance criteria:**

- [ ] Zero literais PT user-facing em `apps/web/src` (exceto dados/
      comentários)
- [ ] Gate verde; e2e passa
