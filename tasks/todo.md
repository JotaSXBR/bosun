# Tasks — Site chat (canal widget)

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Phase 1 — Foundation

- [x] **T1** Schema `site_chat_sessions` + kind `site_chat` (migration, RLS, grants)
- [x] **T2** Adapter `site-chat` (kind/registry/parse/normalize + unit tests)
- [x] **T3** Core `modules/messaging/sitechat.ts` (createWidgetSession, resolveWidgetSession, listWidgetMessages + int tests)

## Checkpoint 1

- [x] `pnpm typecheck` + `pnpm lint` + int tests do módulo verdes (9/9)

## Phase 2 — Endpoints públicos

- [ ] **T4** `POST /api/widget/session` + `POST /api/widget/message` (zod, rate limit, CORS, route int tests)
- [ ] **T5** `GET /api/widget/messages` + `GET /api/widget/stream` (SSE público, route int tests)

## Checkpoint 2

- [ ] Fluxo curl-level: session → msg em `messages` → stream pinga no outbound

## Phase 3 — Widget + config UI

- [ ] **T6** `public/widget.js` (vanilla) + `/widget-demo` page
- [ ] **T7** `/app/integrations`: form kind-aware + config widget (metadata) + snippet

## Checkpoint 3

- [ ] Fluxo manual completo no browser (demo → inbox → resposta no widget)

## Phase 4 — E2E + docs

- [ ] **T8** `e2e/site-chat.spec.ts` + TODO.md/domain-model.md
