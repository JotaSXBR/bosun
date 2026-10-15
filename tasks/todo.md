# Todo — Google Contacts: conexão por workspace

Plano: `tasks/plan.md`.

## Task 1: Tabela `external_connections` + RLS

- [x] Schema Drizzle (`organizationId`, `provider`, `status`, `bundleEncrypted`,
      `accountEmail`, `lastCheckedAt`, `lastError`, timestamps), unique
      `(organization_id, provider)`, `pgPolicy` tenant, `.enableRLS()`
- [x] Migration gerada revisada + custom migration `FORCE ROW LEVEL SECURITY`
      e grants `crm_app`
- **Acceptance**: tabela criada; `crm_app` só enxerga a própria org
- **Verify**: `pnpm db:migrate` · int test de isolamento cross-org ·
  `pnpm --filter @crm/db test`
- **Deps**: nenhuma · **Tamanho**: S

## Task 2: Módulo `@crm/core/external-connections`

- [x] zod do bundle (clientId, clientSecret, tokens, expiry, scopes, state)
- [x] repository com shape público (sem `bundleEncrypted`)
- [x] `google-oauth` injetável (authUrl, exchange, refresh, userinfo) + fake
- [x] service: `saveGoogleClient`, `completeGoogleAuthorization`,
      `verifyGoogleConnection`, `disconnectGoogle`, `getGoogleStatus`
      (`integrations:manage`/`read`, org do ctx)
- [x] export `./external-connections` em `packages/core/package.json`
- **Acceptance**: fluxo pending → connected → needs_reauth → disconnect
  coberto com o fake; segredos nunca no retorno; state de uso único
- **Verify**: `pnpm --filter @crm/core test` (+ `test:integration` do módulo)
- **Deps**: 1 · **Tamanho**: M

### Checkpoint: após 1–2

- [x] `pnpm verify` (lint/typecheck com `--concurrency=2`) e integração verdes · revisar com o humano

## Task 3: Server actions + callback OAuth

- [x] `apps/web/src/server/actions/external-connections.ts`
      (`{ ok } | { ok:false, error }`, `revalidatePath`)
- [x] `api/integrations/google/callback/route.ts`: valida sessão/org +
      state, troca code, redireciona a `/app/settings/channels?google=ok|erro`
- **Acceptance**: state inválido/org diferente → rejeitado sem gravar token;
  sucesso grava `connected` + conta
- **Verify**: teste da route com o fake · `pnpm --filter @crm/web test` ·
  `pnpm typecheck`
- **Deps**: 2 · **Tamanho**: S/M

## Task 4: Card "Google Contacts" na página de canais

- [x] Form client id/secret + **Conectar**; status (conta, token, erro);
      **Verificar**; **Desconectar**; redirect URI copiável
- [x] Textos pt-BR em `apps/web/messages/pt-BR.json` (sentence case, sem emoji)
- [x] Ações só para `integrations:manage`; demais veem status
- **Acceptance**: sem conexão → form; `pending`/`connected`/`needs_reauth`
  renderizam estados distintos; tokens do design system (lint verde)
- **Verify**: `pnpm lint` · `pnpm verify` · checagem manual no `pnpm dev`
  com Google real ou fake
- **Pendente**: checagem visual/manual da página (`pnpm dev`) ainda não feita.
- **Deps**: 3 · **Tamanho**: M

### Checkpoint: final

- [ ] `pnpm verify:full` verde · critérios de pronto do plan marcados ·
      `/review`
