# Tasks — Site chat (canal widget)

Plano: `tasks/plan.md` · Brief: `.task-brief.md`

## Phase 1 — Foundation

- [x] **T1** Schema `site_chat_sessions` + kind `site_chat` (migration, RLS, grants)
- [x] **T2** Adapter `site-chat` (kind/registry/parse/normalize + unit tests)
- [x] **T3** Core `modules/messaging/sitechat.ts` (createWidgetSession, resolveWidgetSession, listWidgetMessages + int tests)

## Checkpoint 1

- [x] `pnpm typecheck` + `pnpm lint` + int tests do módulo verdes (9/9)

## Phase 2 — Endpoints públicos

- [x] **T4** `POST /api/widget/session` + `POST /api/widget/message` (zod, rate limit, CORS, route int tests)
- [x] **T5** `GET /api/widget/messages` + `GET /api/widget/stream` (SSE público, route int tests)

## Checkpoint 2

- [x] Fluxo curl-level: session → msg em `messages` → stream abre e filtra por conversa (8/8 route int tests)

## Phase 3 — Widget + config UI

- [x] **T6** `public/widget.js` (vanilla) + `/widget-demo` page
- [x] **T7** `/app/integrations`: form kind-aware + config widget (metadata) + snippet

## Checkpoint 3

- [x] Fluxo completo no browser — validado pelo E2E real (demo → inbox → resposta no widget via SSE)

## Phase 4 — E2E + docs

- [x] **T8** `e2e/site-chat.spec.ts` verde + TODO.md/domain-model.md
