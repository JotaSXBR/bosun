# 0007: Channel provider abstraction

Status: accepted

## Context

Messaging must support WAHA (self-hosted WhatsApp) and Meta Cloud API without
provider shapes leaking into the CRM domain.

## Decision

`@crm/channels` defines a provider-neutral model (`MessageContent`,
`ChannelEvent`, `ConnectionStatus`) and a minimal `ChannelProvider`
interface. `WahaChannelProvider` and `MetaCloudChannelProvider` adapt each
API (injected `fetch`, Zod validation, HMAC webhook verification). A single
`createChannelProvider` registry switches on `kind`.

## Consequences

- Webhook routes/services stay provider-agnostic; new providers = one
  adapter + registry case.
- chatId↔channelUserId, cents↔reais-style translations stay inside adapters.
- HMAC verification is mandatory — unconfigured verifiers reject requests.

## Alternatives considered

- Direct WAHA SDK shapes in domain: locks the product to one engine —
  rejected.
- Message queue abstraction now: speculative — deferred.
