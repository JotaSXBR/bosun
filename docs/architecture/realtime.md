# Realtime strategy (not implemented yet)

Nothing realtime is built; this records the intended approach so the first
implementation doesn't pick the wrong tool.

## Direction matters

- **Server → client (default): SSE.** Inbox updates, new-message
  notifications, job progress, AI token streaming (AI SDK streams over
  HTTP/SSE already). Simple, HTTP-friendly, works through Coolify/Traefik,
  auto-reconnects.
- **WebSockets only for bidirectional needs** — presence and typing
  indicators are the canonical examples. If a feature is server-push-only,
  it stays SSE.

## Fan-out

Domain services emit events (e.g. `message.received`, audit entries). With a
single instance, in-process emission to SSE streams is enough. Once more than
one instance runs, fan out through **Redis pub/sub** or **Postgres
LISTEN/NOTIFY** — decide when the second instance becomes real.

## Implications

- Webhook ingestion should publish domain events, not just persist rows.
- Keep AI streaming inside the AI SDK transport; don't re-invent it over
  WebSockets.
