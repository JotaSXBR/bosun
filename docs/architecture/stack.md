# Stack e versões

Pesquisa realizada em **2026-10-02** usando o registry npm, Docker Hub, GitHub releases e documentação oficial.
Esta tabela é a fonte de verdade das versões. Ao atualizar uma dependência principal, atualize esta tabela.

## Runtime e tooling

| Tecnologia                       | Versão               | Motivo / Observação                                                                                                                                                                                     |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js                          | 24.x (LTS "Krypton") | LTS ativo hoje. Node 26 vira LTS em 2026-10-28; migrar depois disso. `ai`/`@ai-sdk/*` exigem >=22, Vitest 5 exige ^22.12/^24.                                                                           |
| pnpm                             | 12.8.1               | Gerenciador de workspaces. Fixado via `packageManager`.                                                                                                                                                 |
| Turborepo (`turbo`)              | 2.11.7               | Orquestração de tasks e cache no monorepo.                                                                                                                                                              |
| TypeScript                       | **6.0.3**            | `latest` é 7.0.2 (port nativo em Go), mas `typescript-eslint@8.71` exige `typescript <6.1.0`. TS 6 é a última linha baseada em JS com API compatível. Reavaliar TS 7 quando typescript-eslint suportar. |
| ESLint                           | **9.39.x**           | ESLint 10.11 existe, mas `eslint-plugin-react@7.37`, `eslint-plugin-import@2.32` e `eslint-plugin-jsx-a11y@6.10` (dependências do `eslint-config-next@16`) só suportam até ESLint 9.                    |
| typescript-eslint                | 8.71.0               | Lint com type information (`no-floating-promises`, `no-explicit-any`).                                                                                                                                  |
| eslint-config-next               | 16.3.8               | Regras oficiais do Next (flat config). `next lint` foi removido no Next 16.                                                                                                                             |
| eslint-plugin-simple-import-sort | 14.0.0               | Imports organizados com autofix, zero config.                                                                                                                                                           |
| Prettier                         | 3.9.9                | Formatação. + `prettier-plugin-tailwindcss` 0.8.1 para ordenar classes. Biome foi considerado, mas não cobre as regras do Next/React Hooks com a mesma maturidade.                                      |
| Vitest                           | 5.0.3                | Testes unitários/integração. Requer `vite` ^6/^7/^8.                                                                                                                                                    |
| Playwright (`@playwright/test`)  | 1.63.0               | E2E. Peer opcional do Next 16.                                                                                                                                                                          |

## Aplicação

| Tecnologia          | Versão | Motivo / Observação                                                                                          |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Next.js             | 16.3.8 | App Router, Route Handlers, Server Actions. Turbopack padrão. `middleware.ts` foi renomeado para `proxy.ts`. |
| React / React DOM   | 19.3.0 | Exigido pelo Next 16.                                                                                        |
| Tailwind CSS        | 4.3.3  | Config CSS-first, `@tailwindcss/postcss`.                                                                    |
| shadcn (CLI)        | 4.21.1 | Suporte oficial a monorepo (`components.json` em `apps/web` e `packages/ui`).                                |
| React Hook Form     | 7.89.0 | Forms.                                                                                                       |
| Zod                 | 4.6.5  | Validação (forms, env, payloads de webhook e de jobs). Compatível com AI SDK, `@hookform/resolvers`.         |
| @hookform/resolvers | 5.9.1  | Integração RHF + Zod 4.                                                                                      |

## Dados

| Tecnologia             | Versão                   | Motivo / Observação                                                                                                                                                      |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PostgreSQL             | 18                       | Banco principal. PG18 tem `uuidv7()` nativo. Atenção: a imagem Docker do PG18 usa `PGDATA=/var/lib/postgresql/18/docker`; o volume deve montar em `/var/lib/postgresql`. |
| pgvector               | 0.8.7                    | Imagem `pgvector/pgvector:0.8.7-pg18-trixie`. RAG sem banco vetorial separado.                                                                                           |
| Drizzle ORM            | 0.45.3                   | `latest` estável. Linha 1.0 está em RC (`1.0.0-rc.x`) — não usar até GA.                                                                                                 |
| drizzle-kit            | 0.31.11                  | Migrations versionadas (`generate` + `migrate`).                                                                                                                         |
| postgres (postgres.js) | 3.4.9                    | Driver. Simples, sem dependências nativas.                                                                                                                               |
| Redis                  | 8.8 (`redis:8.8-alpine`) | Apenas infraestrutura disponível; nenhum código depende de Redis ainda.                                                                                                  |

## Auth

| Tecnologia                   | Versão | Motivo / Observação                                                                                                    |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| better-auth                  | 1.7.7  | Autenticação, plugins `organization` (multi-tenant) e `admin` (platform admin). Suporta Next 16 e drizzle-orm ^0.45.2. |
| @better-auth/drizzle-adapter | 1.7.7  | Desde a 1.7 o adapter Drizzle é um pacote separado.                                                                    |

## Jobs, IA, integrações

| Tecnologia                                | Versão                        | Motivo / Observação                                                                                                                                                                                                            |
| ----------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pg-boss                                   | 12.35.0                       | Background jobs in-process no mesmo Postgres — enqueue transacional (`boss.send(..., { db })`), schedules e retries sem infra nova. Schema `pgboss` criado por migration; a app roda `migrate:false` (ADR 0016).               |
| Vercel AI SDK (`ai`)                      | 7.0.127                       | Camada de modelos provider-agnostic. Requer Node >=22.                                                                                                                                                                         |
| @ai-sdk/openai / @ai-sdk/anthropic        | 4.0.83 / 4.0.71               | Providers iniciais (exemplos do padrão).                                                                                                                                                                                       |
| WAHA                                      | 2026.9.2 (`devlikeapro/waha`) | WhatsApp não oficial. Auth via header `X-Api-Key`; webhooks com HMAC opcional. Não roda no compose por padrão.                                                                                                                 |
| Meta WhatsApp Cloud API                   | Graph API v26.0               | Versão atual (lançada 2026-07-29). Webhooks assinados com `X-Hub-Signature-256` (HMAC-SHA256 do raw body com o App Secret).                                                                                                    |
| ASAAS                                     | API v3 (REST, sem SDK)        | Produção `https://api.asaas.com/v3`, sandbox `https://api-sandbox.asaas.com/v3`. Auth header `access_token`. Webhook autenticado pelo header `asaas-access-token`; entrega _at least once_ → idempotência pelo `id` do evento. |
| @aws-sdk/client-s3 / s3-request-presigner | 3.1146.0                      | Adapter S3-compatible.                                                                                                                                                                                                         |
| RustFS                                    | 1.0.0 (`rustfs/rustfs`)       | S3 local. MinIO community foi arquivado (distribuição apenas em código-fonte); RustFS é Apache-2.0, GA em 2026-09-16. Apenas para dev local; produção usa qualquer S3-compatible.                                              |
| Resend                                    | API HTTP (sem SDK)            | Adapter via `fetch` — evita dependência para uma única chamada.                                                                                                                                                                |
| nodemailer                                | 10.0.13                       | Adapter SMTP.                                                                                                                                                                                                                  |

## Observabilidade

| Tecnologia         | Versão | Motivo / Observação                                                                                                                                            |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @vercel/otel       | 2.1.3  | Registro OpenTelemetry no `instrumentation.ts` do Next. Ativo apenas se `OTEL_EXPORTER_OTLP_ENDPOINT` estiver definido.                                        |
| @opentelemetry/api | 1.9.1  | API estável.                                                                                                                                                   |
| @sentry/nextjs     | 11.4.0 | Captura de erros. O protocolo é compatível com GlitchTip (basta trocar o DSN). Usado com `skipOpenTelemetrySetup: true` para não conflitar com `@vercel/otel`. |

## Incompatibilidades registradas

1. **TypeScript 7 × typescript-eslint** — usar TS 6.0.3.
2. **ESLint 10 × plugins do eslint-config-next** — usar ESLint 9.39.x.
3. **MinIO community arquivado** — usar RustFS localmente.
4. **Drizzle 1.0** ainda em RC — usar 0.45.x.
