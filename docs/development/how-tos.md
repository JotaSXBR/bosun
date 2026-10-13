# How-tos

Recipes for recurring change types. These were moved out of `AGENTS.md`
(which stays short — only inviolable rules and pointers). Follow the
matching checklist end-to-end; each step has a reason.

- **New domain module**: `packages/core/src/modules/<name>/{index,service,repository,schemas}.ts`,
  export from module index; take `db` + `TenantContext`, assert permissions
  inside the service.
- **New tenant-owned table**: follow the checklist in "Database & migrations"
  (`AGENTS.md`) and `docs/database/README.md`.
- **Channel webhook ingestion**: `POST /api/webhooks/channels/<webhookToken>`
  resolves the connection under `withServiceAccess` (unguessable token),
  verifies the provider signature on the raw body, then ingests each
  `ChannelEvent` via `@crm/core/messaging` inside `withTenant` and enqueues
  `process-channel-event`. Connection credentials are AES-256-GCM under
  `CHANNEL_CREDENTIALS_KEY` (`@crm/core/crypto`).
- **New ChannelProvider** (e.g. Instagram, Telegram): add
  `packages/channels/src/adapters/<name>.ts` implementing `ChannelProvider`
  (`src/provider.ts`), normalize webhooks into `ChannelEvent`
  (`src/domain.ts`), add the kind to `ChannelProviderKind` and one `case` in
  `createChannelProvider` (`src/registry.ts`). Fixture-based tests for
  signature verification, parsing and outbound requests.
- **New BillingProvider**: `packages/billing/src/adapters/<name>.ts`
  implementing `BillingProvider`; money is integer cents in the domain,
  conversion only inside the adapter; webhook `eventId` is the idempotency
  key; register in `createBillingProvider` (`src/registry.ts`).
- **New AI provider**: add the `@ai-sdk/<provider>` package to `packages/ai`,
  extend `ModelRef["provider"]` and the switch in `resolveLanguageModel`
  (`src/model.ts`), add the API key to `@crm/config`. Agents only reference a
  `ModelRef`; never import a provider SDK elsewhere.
- **New agent tool**: `defineAgentTool({ requiredPermissions, execute(ctx, input) })`
  calling `@crm/core` services; register it and list it in the agent's `tools`.
- **New StorageProvider**: implement `StorageProvider`
  (`packages/storage/src/domain.ts`) next to `S3StorageProvider`; keep keys
  produced by `tenantObjectKey`.
- **New EmailProvider**: `packages/email/src/providers/<name>.ts` +
  one branch in `createEmailProvider` + `EMAIL_PROVIDER` enum in `@crm/config`.
- **New job/task**: `packages/automation/src/tasks/<name>.ts` — a zod
  payload schema + plain async handler; rebuild TenantContext from the DB,
  never trust payload beyond identity; enqueue helper in `src/enqueue.ts`,
  pass `tx` when inside a transaction (`boss.send` via `fromDrizzle` is
  atomic with the write); enqueue must no-op (`{ skipped: true }`) when the
  boss isn't started. Register queue+work(+schedule) in `boss.ts`. Jobs run
  in-process — no worker tier (see `docs/development/jobs-pg-boss.md`).
- **New UI component**: check `design-system/COMPONENTS.md` and the
  showcase first — extend before adding. Otherwise add
  `design-system/src/components/<kebab>.tsx` (Radix primitive underneath when
  behavior is non-trivial, `cva` variants, DS utilities only), covering
  default/hover/active/focus-visible (`shadow-focus`)/disabled plus
  loading/error/empty/selected where they apply; spread rest props on the
  interactive root so the showcase's `data-preview` states work. Then add a
  showcase section (`design-system/src/showcase/`) and its usage to
  `COMPONENTS.md`. The prop/variant contract is the component's TS type
  (strict typecheck replaces the dump's per-prop allowlists);
  `tooling/eslint/design-system.js` covers what TS can't see (raw hex/px,
  non-DS fonts, imports of DS internals). A missing token goes into
  DESIGN.md + tokens CSS + `@theme` in `globals.css` in the same change.
