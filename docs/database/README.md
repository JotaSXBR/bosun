# Database

PostgreSQL 18 + pgvector, Drizzle ORM, postgres.js.

## Schema overview

- **Better Auth tables** (`users`, `sessions`, `accounts`, `verifications`,
  `organizations`, `organization_members`, `organization_invitations`):
  owned by Better Auth; plural snake_case; NOT under tenant RLS.
- **`audit_logs`**: tenant-scoped; `organization_id` + RLS policy — the
  reference example for new tenant tables.
- **`channel_connections`**: tenant-scoped provider accounts (WAHA/Meta
  Cloud). `credentials_encrypted` holds AES-256-GCM JSON
  (`CHANNEL_CREDENTIALS_KEY`); `webhook_token` (unique) authenticates inbound
  webhooks at `/api/webhooks/channels/<token>`.
- **`contacts`**: tenant-scoped channel contacts, unique per
  (organization_id, channel_user_id).
- **`conversations`**: tenant-scoped threads, unique per
  (channel_connection_id, external_id).
- **`messages`**: tenant-scoped normalized messages (ChannelEvent
  MessageContent in `content`). Partial unique index on
  (channel_connection_id, external_id) WHERE external_id IS NOT NULL is the
  webhook idempotency key (inserts use ON CONFLICT DO NOTHING).
- **`billing_customers`**: tenant-scoped, 1:1 org ↔ ASAAS customer
  (`organization_id` and `external_id` unique); `external_id` resolves
  inbound webhook payloads to a tenant.
- **`billing_subscriptions`**: tenant-scoped ASAAS subscriptions, unique per
  `external_id`; status in (pending, active, overdue, canceled), cycle in
  (monthly, yearly), amounts in integer cents.
- **`billing_payments`**: tenant-scoped payments upserted by unique
  `external_id` (ASAAS payment id — webhook idempotency).
  `billing_subscription_id` nullable: payment events can arrive before the
  subscription row exists.
- **`billing_webhook_events`**: ASAAS webhook dedup — `event_id` unique,
  inserts ON CONFLICT DO NOTHING. `organization_id` nullable (resolved during
  processing); null-org rows are platform-internal and invisible to tenant
  contexts by the same policy.

## Roles

- `crm` (POSTGRES_USER): owner/superuser-ish; migrations + grants;
  `DATABASE_ADMIN_URL`.
- `crm_app`: app runtime role (`NOSUPERUSER NOBYPASSRLS`); `DATABASE_URL`.
  Created by `docker/postgres/init/01-app-role.sh`.

## Migration workflow

```
edit packages/db/src/schema/* → pnpm db:generate → review SQL → pnpm db:migrate
```

- Never edit applied migrations; new changes are new migrations.
- RLS policies, `FORCE ROW LEVEL SECURITY`, grants and default privileges
  for `crm_app` are written as custom migration SQL (see `0002`).

## RLS checklist (new tenant table)

1. `organization_id` column (uuid, not null, references organizations).
2. `pgPolicy` using `current_setting('app.organization_id', true)` and
   `app.platform_scope = 'on'` bypass, plus `.enableRLS()`.
3. Migration grants (SELECT/INSERT/UPDATE/DELETE) to `crm_app` and default
   privileges for future tables.
4. Integration test proving org A can't see org B's rows.

## pgvector plan

`vector` extension is already enabled. Future embedding tables MUST include
`organization_id` and the same RLS policy (embeddings are tenant data).
HNSW index (`vector_cosine_ops`) once a table has real rows — indexes on
empty tables aren't worth planning around yet.
