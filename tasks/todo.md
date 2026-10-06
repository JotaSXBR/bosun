# Tasks — Config de produto em DB (env→DB)

Brief: `.task-brief.md` · Plan: `tasks/plan.md`

## Fase 1 — DB + core module

- [x] **T1** `platform_settings` (key PK, value_encrypted, updated_by,
      updated_at) + RLS `app.platform_scope='on'` + grant `crm_app` +
      migration + int test de isolamento — migrations 0013/0014 aplicadas,
      `tenant.int.test.ts` 8/8
- [x] **T2** `@crm/core/platform` — schemas por grupo, repository,
      `resolveProductSettings`, `isProductConfigured`, `setPlatformSetting`
      (platform_admin gate + field-merge + audit) — `service.int.test.ts` 8/8

## Checkpoint 1 — typecheck+lint+int platform + migrate limpo ✅

## Fase 2 — Consumers

- [x] **T3** `server/auth.ts` + sendEmail lazy (DB→env) + call sites
      (`api/auth/[...all]`, `tenant.ts`, `actions/organization.ts`)
- [x] **T4** billing: `asaasProvider(resolved)` — service + webhook leem
      `resolveBillingConfig` (int test DB-override ✅)
- [x] **T5** meta: `metaCloudCredentialsInput` (appSecret/verifyToken/graphApi
      blankable) + merge platform-defaults no create (int tests ✅).
      Follow-up: form de conexão ainda exige os campos (fora do escopo —
      `app/integrations/`)

## Checkpoint 2 — int billing+integrations verdes ✅ (37/37)

## Fase 3 — UI

- [x] **T6** seção Plataforma em `/app/settings` (write-only secrets,
      badge "(banco)" em campos com override DB; e2e: oculta p/ member)
- [x] **T7** wizard `/app/setup` + gate `platform_admin && !email` em
      `requireTenantContext`; action usa `requireSession` (sem loop);
      e2e spec cobrindo ambos os caminhos

## Checkpoint 3 — gate completo + docs (TODO→Concluído, .env.example) ✅
