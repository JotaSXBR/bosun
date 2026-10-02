# Domain map

| Domain                                         | Status         | Where                                                            |
| ---------------------------------------------- | -------------- | ---------------------------------------------------------------- |
| Identity / Organizations / Users / Permissions | implemented    | `@crm/auth`, `@crm/permissions`, `@crm/core` organizations       |
| Audit                                          | implemented    | `@crm/core` audit module + `audit_logs` table                    |
| CRM (contacts, pipelines)                      | planned        | future `@crm/core` module                                        |
| Messaging                                      | provider layer | `@crm/channels` (WAHA, Meta Cloud) — inbox/conversations planned |
| AI                                             | provider layer | `@crm/ai` (agents, permissioned tools) — features planned        |
| Automation                                     | provider layer | `@crm/automation` (Trigger.dev) — onboarding task implemented    |
| Campaigns                                      | planned        | —                                                                |
| Billing                                        | provider layer | `@crm/billing` (Asaas) — plan enforcement planned                |
| Storage                                        | provider layer | `@crm/storage` (S3/RustFS)                                       |
| Notifications                                  | provider layer | `@crm/email` (console/Resend/SMTP)                               |

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
