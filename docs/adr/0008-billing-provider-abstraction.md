# 0008: Billing provider abstraction

Status: accepted

## Context

Billing (Asaas for the Brazilian market) must not leak REST shapes into the
domain; webhook delivery is at-least-once so events need idempotency keys.

## Decision

`@crm/billing` defines `BillingProvider` (customers, subscriptions, webhook
verify/parse) with money as integer cents and `BillingEvent.eventId` as the
idempotency key. `AsaasBillingProvider` does plain `fetch` against the v3
REST API (`access_token` header), converts cents↔reais exactly, and verifies
webhooks via the `asaas-access-token` header.

## Consequences

- Domain only sees cents and normalized event names.
- Callers must deduplicate on `eventId`.
- Adding a second provider later is an adapter, not a refactor.

## Alternatives considered

- Asaas SDK: unofficial/heavy; REST + Zod is explicit and testable.
- Stripe-first: wrong market for now; abstraction keeps the option open.
