# Implementation Plan — Config de produto em DB (env→DB) + settings/wizard

## Overview

Config de produto (e-mail, Asaas, Meta, AI keys de plataforma) migra de
env para `platform_settings` criptografada em DB (AES-256-GCM, root key
`CHANNEL_CREDENTIALS_KEY`), leitura **DB → env** por grupo. UI: seção
"Plataforma" em `/app/settings` visível só a `platform_admin` + wizard
`/app/setup` de primeira execução. Destrava sign-up/verify sem env Resend.
Brief: `.task-brief.md`.

## Architecture Decisions

- **Tabela `platform_settings`**: `(key text PK, value_encrypted text,
updated_by uuid→users, updated_at)` — uma row por grupo
  (`email`,`billing`,`meta`,`ai`), `encryptJson` no valor inteiro.
  RLS com predicado `app.platform_scope = 'on'` — nem tenant nem service
  tokens leem sem `withPlatformScope` (decisão "só se RLS" do usuário
  aplicada por extensão: nada fora do guard).
- **Resolver em `@crm/core/platform`**: `resolveProductSettings(db)`
  retorna `{ email, billing, meta, ai }` no mesmo shape do `ServerEnv`
  (consumers trocam `env.email` → `settings.email` sem mudar factory).
  DB vence env por campo/grupo; `isProductConfigured(group)` reusa os
  predicados do `isConfigured` sobre o merge.
- **Sem cache v1**: leituras são low-volume (envio de e-mail, webhook,
  página) — query direta evita staleness e invalidação. Reavaliar se
  aparecer hot path.
- **E-mail lazy**: composição do auth move de `@crm/auth.getAuth` para
  `apps/web/src/server/auth.ts` — `sendEmail` resolve o provider a cada
  envio (`createEmailProvider({email: resolved, nodeEnv})`), então trocar
  config não exige restart. `@crm/auth` mantém `createAuth` puro;
  `getAuth` legado fica p/ seed/tests.
- **Meta = defaults**: merge no `createChannelConnection` (connection
  vence; campos ausentes caem no platform meta) — snapshot igual ao WAHA.
  `appSecret`/`verifyToken` passam a optional na conexão, validados
  **pós-merge** (phoneNumberId+accessToken continuam obrigatórios).
- **Wizard**: gate em `requireTenantContext` → `platform_admin &&
!isProductConfigured("email")` → `redirect("/app/setup")`. `/app/setup`
  usa `requireSession` + check de role próprio (sem loop). Members nunca
  veem. Env-only também conta como configurado (fallback env legítimo).
- **Secrets write-only**: UI exibe placeholder `••• configurado`; campo
  vazio no submit = preserva valor guardado (merge em field-level no
  service). GET nunca retorna secret descriptografado ao cliente.

## Task List

### Fase 1 — DB + core module

- [ ] **T1** db: `platform_settings` schema + migration (`pgPolicy`
      platform-scope, `.enableRLS()`, grant crm_app via custom migration
      no padrão 0002) + int test provando tenant-scope não lê.
- [ ] **T2** core: `modules/platform/{index,service,repository,schemas}`
      — zod por grupo, `getPlatformSetting`/`setPlatformSetting`
      (gate `ctx.isPlatformAdmin`, merge field-level, audit log),
      `resolveProductSettings`, `isProductConfigured`. Int tests: CRUD,
      merge DB→env, secret-merge, gate não-admin.

### Checkpoint 1

- [ ] `pnpm typecheck` + `lint` + int `platform` verdes; `db:migrate` limpo.

### Fase 2 — Consumers

- [ ] **T3** e-mail: `apps/web/src/server/auth.ts` (composição nova;
      call sites `api/auth/[...all]`, `tenant.ts`, `organization.ts`),
      sendEmail lazy via `resolveEmailConfig`. Sign-up funciona com
      Resend só-em-DB. `@crm/email` inalterado se assinatura bastar.
- [ ] **T4** billing: `resolveBillingConfig` no lugar de
      `process.env.ASAAS_*` (service + webhook route). Int test com
      config em DB.
- [ ] **T5** meta: `metaCloudCredentialsSchema` campos optional +
      merge platform-defaults em `createChannelConnection`; rejeita se
      pós-merge faltar phoneNumberId/accessToken. Int test.

### Checkpoint 2

- [ ] Typecheck/lint verdes; int billing+integrations; sign-up e2e smoke
      com e-mail em DB.

### Fase 3 — UI

- [ ] **T6** settings: seção Plataforma em `/app/settings` (4 cards de
      grupo, write-only secrets, save via server action). Visível só
      `isPlatformAdmin`. E2e spec: hidden para member.
- [ ] **T7** wizard `/app/setup`: form do grupo e-mail + gate no
      `requireTenantContext`. E2e smoke.

### Checkpoint 3 (final)

- [ ] Gate completo verde + int tests novos + `TODO.md` → Concluído +
      `.env.example` anotando grupos migráveis.

## Risks and Mitigations

| Risk                                   | Impact | Mitigation                                                            |
| -------------------------------------- | ------ | --------------------------------------------------------------------- |
| `getAuth` singleton com resolver velho | Médio  | Resolver por envio (nunca captura provider)                           |
| RLS platform-scope errado vaza secrets | Alto   | Int test tenant-scope não lê + grant explícito                        |
| Merge meta quebra conexões existentes  | Médio  | Só fill de campos ausentes; snapshot preserva o que já está salvo     |
| Wizard loop (setup chama o gate)       | Baixo  | `/app/setup` usa `requireSession` próprio, não `requireTenantContext` |

## Open Questions

- nenhuma — decisões fechadas no brief.
