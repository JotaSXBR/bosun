# Realtime

Server → client push runs over **SSE**; fan-out between app instances runs
over **Postgres LISTEN/NOTIFY**. No Redis dependency.

## Producer: pg_notify inside the write transaction

`emitDomainEvent(executor, event)` (`packages/db/src/realtime.ts`) sends a
compact JSON event on the `crm_domain_events` channel:

```ts
await emitDomainEvent(tx, {
  type: "message.received",
  organizationId,
  conversationId,
  messageId,
  contactId,
  sentAt,
});
```

It MUST be called inside the transaction that persists the change —
`pg_notify` only delivers on commit, so listeners never see events for
rolled-back writes, and a committed event is guaranteed to refer to visible
rows. Payloads carry ids, not row data, and must stay under Postgres' 8 KB
notify limit. `domainEventSchema` (zod, loose object with `type` +
`organizationId` required) is the shared contract for producers and
consumers.

`ingestChannelEvent` emits `message.received` right after the message insert
inside the same tenant transaction — and only when the insert returned a
row, so idempotent webhook replays don't re-notify.

## Consumer: LISTEN on a dedicated connection

`subscribeDomainEvents(organizationId, onEvent)` (same file) opens a
**dedicated postgres.js connection per subscriber** and `LISTEN`s on the
channel. A LISTEN connection is occupied for its whole lifetime, so it must
never come from the pooled app client; one connection per subscriber also
keeps unsubscribe trivial (`unlisten` + `client.end()`). LISTEN connections
are cheap at our scale — revisit only if a single instance ever needs
hundreds of concurrent subscribers.

Every payload is zod-parsed and filtered by `organizationId` before reaching
`onEvent`. NOTIFY is database-wide — that filter is what enforces tenant
isolation on this channel, so never bypass `subscribeDomainEvents` with a
raw listener for tenant data.

## SSE route

`GET /api/conversations/stream`
(`apps/web/src/app/api/conversations/stream/route.ts`):

- Derives the `TenantContext` from the Better Auth session exactly like the
  /app pages (`getTenantContext` in `src/server/tenant.ts`) — the
  organization never comes from query params. Unauthenticated → 401.
- Responds with a `ReadableStream`
  (`text/event-stream; charset=utf-8`, `cache-control: no-cache,
no-transform`, `x-accel-buffering: no`), sends `retry: 3000` and a
  `: connected` comment up front, then a `: ping` heartbeat every 25 s
  (keeps proxies from idle-closing the stream).
- Each domain event is sent as one `data:` line. On request abort/stream
  cancel it clears the heartbeat, awaits the unsubscribe and closes the
  stream. Errors go through `captureException` and close the stream.

## UI

- `/app/inbox` (server component) lists conversations via
  `listTenantConversations` — contact displayName/channelUserId, status,
  lastMessageAt and a one-line last-message preview.
- `InboxLive` (`src/components/inbox-live.tsx`) is mounted in the /app
  layout, so every app page opens `new
EventSource("/api/conversations/stream")` (same-origin — CSP `connect-src
'self'` covers it) and debounce-refreshes the route (~500 ms) on each
  event, with a subtle "nova mensagem" indicator. EventSource
  auto-reconnects using the `retry` field.

## Direction and scaling notes

- **Server → client stays SSE.** WebSockets are only for bidirectional
  needs (presence, typing indicators). AI streaming stays inside the AI SDK
  transport.
- LISTEN/NOTIFY **already fans out across app instances**: a commit on any
  instance notifies listeners on all of them, so the design works
  multi-instance as-is.
- NOTIFY has no history/replay — SSE clients get events that happen while
  connected. That's sufficient for refresh triggers (reads always hit the
  DB), but it is NOT a delivery queue.
- If we outgrow per-subscriber LISTEN connections or need durable delivery,
  swap the fan-out to Redis pub/sub behind the same
  `subscribeDomainEvents`/`emitDomainEvent` interface — producers and the
  SSE route wouldn't change.
