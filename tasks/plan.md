# Plan — Forms de auth submetem GET nativo (senha vaza na URL)

- **Origem**: report do usuário + reprodução via Chrome DevTools MCP —
  `form.submit()` nativo navegou para
  `/sign-in?email=...&password=...` (default HTML é GET; React só
  intercepta depois de hidratado)
- **Lifecycle**: /spec → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-13

## Objetivo

Impedir que credenciais vazem para URL/histórico/logs quando o form de
autenticação é submetido antes da hidratação do React (ou com JS falho).

## Contexto

- Bug preexistente no `main` — não relacionado ao seed (PR #35).
- `<form onSubmit={form.handleSubmit(...)}>` sem `method`: submit nativo
  usa GET → campos viram query string.
- Fix mínimo suficiente: `method="post"` — submit nativo passa a mandar os
  campos no body (POST numa page route retorna 405, mas não vaza nada).
- Os outros 9 forms do app têm o mesmo padrão mas não carregam credenciais;
  ficam fora (mesma classe de bug, sem segredo — avaliar depois).

## Escopo

apps/web/src/app/sign-in/page.tsx
apps/web/src/app/sign-up/page.tsx
tasks/**

## Fora de escopo

- Demais forms do app (profile, settings, etc.) — sem credenciais.
- Progressive enhancement real (action nativo funcionando sem JS).
- Mudanças no transporte do authClient (já é POST quando hidratado).

## Tarefas

1. Adicionar `method="post"` aos forms de sign-in e sign-up.
2. `pnpm verify` + reprodução nativa no Chrome (submit deve não vazar).
3. Commit + push + PR.

## Critérios de pronto

- [ ] Submit nativo do form não coloca email/senha na URL
- [ ] Fluxo React normal (signIn.email via client) continua funcionando
- [ ] `pnpm verify` verde
