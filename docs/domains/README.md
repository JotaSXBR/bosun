# Domain map

Product-side source of truth: `docs/product/` (modelo, regras, IA,
roadmap — ADR 0014).

| Domain                                         | Status         | Where                                                                                                                                                                                                                        |
| ---------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity / Organizations / Users / Permissions | implemented    | `@crm/auth`, `@crm/permissions`, `@crm/core` organizations                                                                                                                                                                   |
| Audit                                          | implemented    | `@crm/core` audit module + `audit_logs` table                                                                                                                                                                                |
| Integrations (channel connections)             | implemented    | `@crm/core` integrations + `channel_connections`, `/app/integrations`                                                                                                                                                        |
| CRM (contacts, pipelines)                      | planned        | future `@crm/core` module                                                                                                                                                                                                    |
| Messaging                                      | implemented    | `@crm/channels` providers + `@crm/core` messaging (ingest via `POST /api/webhooks/channels/<token>` → `contacts`/`conversations`/`messages`); `/app/inbox` com atualização ao vivo via SSE (`docs/architecture/realtime.md`) |
| AI                                             | provider layer | `@crm/ai` (agents, permissioned tools) — features planned                                                                                                                                                                    |
| Automation                                     | provider layer | `@crm/automation` (pg-boss in-process) — onboarding + channel-event fan-out + closed sweep                                                                                                                                   |
| Campaigns                                      | planned        | —                                                                                                                                                                                                                            |
| Billing                                        | implemented    | `@crm/billing` (Asaas) + `@crm/core` billing + `billing_*` tables; ingest via `POST /api/webhooks/billing/asaas` (idempotent on `event_id`) — plan enforcement/UI planned                                                    |
| Storage                                        | provider layer | `@crm/storage` (S3/RustFS)                                                                                                                                                                                                   |
| Notifications                                  | provider layer | `@crm/email` (console/Resend/SMTP)                                                                                                                                                                                           |

## Module template

A domain module in `packages/core/src/modules/<name>/` follows:

```
<name>/
  index.ts        — public API only (services + types)
  service.ts      — business logic; takes (db, ctx, input); asserts permissions
  repository.ts   — drizzle queries; always scoped by organizationId
  schemas.ts      — zod input schemas
```

Rules: services are the only callers of repositories; modules expose types
through `index.ts`; cross-module imports go through each module's index.
