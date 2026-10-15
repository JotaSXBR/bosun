# Plan — Google Contacts: conexão por workspace (slice 1/3)

- **Origem**: `TODO.md` → P2 Google · `docs/product/contacts-google-sync.md` (§ Connection)
- **Lifecycle**: /spec ✓ → /plan-task → /build → /test → /review → /ship
- **Data**: 2026-10-15

## Objetivo

Uma organização conecta (e desconecta/verifica) uma conta Google para
contatos via UI, com OAuth BYOK e tokens cifrados em `external_connections`
— sem sincronizar nenhum contato ainda.

## Contexto

Decisões do gate de esclarecimento (2026-10-15):

- **Fatiamento em 3 plans sequenciais**: (1) este — tabela + OAuth BYOK +
  card de status; (2) perfil do contato (`metadata` zod + edição na
  ficha); (3) job `contact-google-sync` (push contínuo + bulk inicial +
  People API). Os campos "contatos sincronizados / última sync" do card
  ficam fora até o plan 3.
- **Card em `/app/settings/channels`** (componente `IntegrationsPage`).
  O spec cita `/app/settings/integrations`, rota que não existe; sem
  rota nova nem mudança no `hub.ts`.
- **Segredos cifrados com `@crm/core/crypto` (`encryptJson`)**: client
  id/secret + tokens num bundle único em `external_connections`
  (mesmo padrão de `org_llm_credentials`/`channel_connections`). Zero env
  de plataforma, zero dependência nova (OAuth via `fetch` direto em
  `accounts.google.com` / `oauth2.googleapis.com`).
- **Permissão**: `integrations:manage` conecta/verifica/desconecta;
  `integrations:read` vê o status. Sem mudança no pacote `permissions`.
- **Anti-CSRF do OAuth (provisório)**: `state` = nonce aleatório guardado
  cifrado no bundle da conexão `pending`; o callback exige sessão com a
  mesma org e nonce igual (uso único). Nunca confiar em `organizationId`
  vindo do cliente/query.
- **Cliente Google dentro de `@crm/core`** atrás de uma interface
  injetável (fake no teste) — provisório: o adapter "de verdade" da People
  API entra no plan 3, e aí decidir se vira pacote próprio (AGENTS.md:
  adapters só em registry factory).
- **Redirect URI** = `${origin}/api/integrations/google/callback` (origin
  derivado dos headers como o webhook URL do canal); o card mostra a URI
  para a org cadastrar no console do Google.
- **Uma conexão por (org, provider)**: unique index; reconectar
  sobrescreve o bundle.
- Status: `pending` (client salvo, sem consent) → `connected` →
  `needs_reauth` (refresh falhou) | `error`. Escopo OAuth:
  `https://www.googleapis.com/auth/contacts` + `openid email` (para
  exibir a conta conectada).
- **Ajuste de tooling autorizado em 2026-10-15** (revisão de custo de tokens/Claude
  Code): `package.json` (turbo `--concurrency=2`), `codegraph.json` e
  `.prettierignore` entram no Escopo.
  `apps/web/src/server/services.ts` entra no Escopo (2026-10-15) para a
  leitura do status do Google: a regra de lint proíbe a página de
  importar `@crm/db`. Skills do projeto removidas: o
  ciclo usa só as skills globais do Claude Code (`spec-driven-development`,
  `planning-and-task-breakdown`, `incremental-implementation`,
  `test-driven-development`, `code-review-and-quality`,
  `git-workflow-and-versioning`), e o `tasks/plan.md` segue
  `docs/development/plan.template.md` (`## Contexto` + `## Escopo`).

## Escopo

- `packages/db/src/schema/**`
- `packages/db/migrations/**`
- `packages/db/src/**/*.test.ts`
- `packages/core/package.json`
- `packages/core/src/modules/external-connections/**`
- `packages/core/src/index.ts`
- `apps/web/src/server/actions/external-connections.ts`
- `apps/web/src/app/api/integrations/google/**`
- `apps/web/src/app/app/settings/channels/**`
- `apps/web/messages/pt-BR.json`
- `apps/web/e2e/**`
- `apps/web/src/server/services.ts`
- `package.json`
- `codegraph.json`
- `.prettierignore`

## Fora de escopo

- Perfil estendido do contato / edição na ficha (plan 2).
- Job `contact-google-sync`, People API, bulk sync, contadores de sync
  (plan 3).
- Pull / delete propagation / fotos / grupos (non-goals do spec).
- Nova rota `/settings/integrations`, mudanças no `hub.ts` ou no pacote
  `permissions`.
- Refatorar o card de canais existente.

## Tarefas

1. **Tabela `external_connections` + RLS** — schema Drizzle, migration
   (`pnpm db:generate`, revisar SQL) + custom migration `FORCE RLS` /
   grants `crm_app`; teste de integração de isolamento cross-org.
2. **Módulo `@crm/core/external-connections`** — zod do bundle,
   repository (shape público sem segredos), `google-oauth` (authUrl,
   troca de code, refresh, userinfo) injetável + fake, service
   (`saveGoogleClient`, `completeGoogleAuthorization`, `verify`,
   `disconnect`, `getStatus`), export no `package.json`; unit + int tests.
3. **Server actions + callback OAuth** — `external-connections.ts`
   (retorno `{ ok }|{ ok:false, error }`, org da sessão) e
   `api/integrations/google/callback/route.ts` (valida state/sessão,
   redireciona ao card com resultado); teste da route com o fake.
4. **Card "Google Contacts" em `/app/settings/channels`** — form de client
   id/secret + Conectar, status (conta, saúde do token, erro),
   Verificar, Desconectar, redirect URI copiável; i18n pt-BR; só
   `integrations:manage` vê as ações. Tokens do design system.

Checkpoint após 1–2: `pnpm verify` + `test:integration` do módulo verdes
antes de tocar a web.

Detalhe de acceptance + verify por task em `tasks/todo.md`.

## Riscos

| Risco                                                     | Impacto | Mitigação                                                            |
| --------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| Callback sem sessão (cookie SameSite perdido no redirect) | Médio   | Callback GET same-site; falha → mensagem pedindo reconectar          |
| Tokens/segredo vazando em log ou na UI                    | Alto    | Shape público sem bundle; `captureException`; teste de não-vazamento |
| Consent screen em "Testing" expira refresh em 7 dias      | Médio   | `needs_reauth` visível + doc do passo no card                        |

## Critérios de pronto

- [x] `pnpm verify` verde
- [x] `pnpm verify:full` verde (toca DB): int test de isolamento cross-org
      de `external_connections`
- [x] Teste: callback rejeita state inválido (org diferente: coberto pelo teste
      de isolamento por org do serviço e pela RLS, sem teste de callback dedicado)
- [x] Teste: segredos nunca no shape público (logs: conferido por leitura do
      código, sem teste automatizado)
- [x] Docs atualizadas: `docs/domains` (integrations), `docs/database`
      (tabela), `docs/product/contacts-google-sync.md` (rota real do card)
- [x] `TODO.md`: item Google → slice 1 concluída, slices 2–3 listadas
