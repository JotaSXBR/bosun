# Provider architecture

Five abstractions keep the domain provider-neutral; each lives in a package
with the same shape: `src/domain.ts` (types + interface), `src/adapters/*`
(provider code), `src/registry.ts` (the only `switch` on provider kind), and a
`testing` export with a fake.

| Package         | Interface             | Adapters                                                 |
| --------------- | --------------------- | -------------------------------------------------------- |
| `@crm/channels` | `ChannelProvider`     | `WahaChannelProvider`, `MetaCloudChannelProvider`        |
| `@crm/billing`  | `BillingProvider`     | `AsaasBillingProvider`                                   |
| `@crm/storage`  | `StorageProvider`     | `S3StorageProvider`, `InMemoryStorageProvider` (testing) |
| `@crm/email`    | `EmailProvider`       | console, Resend (HTTP), SMTP (nodemailer)                |
| `@crm/ai`       | `ModelRef`/`runAgent` | OpenAI, Anthropic via AI SDK                             |

## Rules

- HTTP adapters take an injected `fetch` — tests assert URL/headers/body.
- Every external payload (responses and webhooks) is Zod-validated.
- Webhook flow: `provider → route → verifyWebhook(raw request) → adapter
parse → domain events`. Verification always precedes parsing; unsigned or
  unconfigured-verifier webhooks are rejected.
- Channel webhooks hit `POST /api/webhooks/channels/<webhookToken>`: the token
  resolves the `channel_connections` row under `withServiceAccess`,
  credentials are decrypted (`CHANNEL_CREDENTIALS_KEY`), the signature is
  verified on the raw body, and events are ingested inside the connection's
  `withTenant` scope — idempotent via the messages partial unique index —
  then fanned out to the `process-channel-event` Trigger task.
- Billing webhooks hit `POST /api/webhooks/billing/asaas` (single
  platform-level ASAAS account, credentials in env): `handleAsaasWebhook`
  (`@crm/core` billing) verifies the shared `asaas-access-token` header
  against `ASAAS_WEBHOOK_TOKEN`, then in one `withServiceAccess` transaction
  records the raw event in `billing_webhook_events` — the unique `event_id`
  is the idempotency key, replays return `{ duplicate: true }` — resolves the
  tenant via `billing_customers.external_id`, upserts `billing_payments` by
  payment `external_id` and marks the event processed.
- Money crosses adapter boundaries as integer cents; ids map to
  `externalId`/`channelUserId` inside adapters.
- Provider secrets come only from env (`@crm/config`); never logged
  (the logger redacts secret-like keys anyway).

## Current providers

- **WAHA** (`waha`): session-based WhatsApp; QR pairing, HMAC-SHA512 webhooks
  (`X-Webhook-Hmac`), `X-Api-Key` auth.
- **Meta Cloud** (`meta_cloud`): WhatsApp Business Cloud; `x-hub-signature-256`
  SHA-256 webhooks, `hub.verify_token` challenge handshake.
- **Asaas** (`asaas`): customers/subscriptions; `access_token` header auth,
  `asaas-access-token` webhook token, at-least-once delivery → callers must be
  idempotent on `eventId`.
