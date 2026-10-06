# 0002: Modular monolith

Status: accepted

## Context

A small team building a CRM doesn't need service meshes; it needs clear
boundaries and one deployable.

## Decision

One Next.js app hosts UI + API + auth; domain modules live in
`packages/core/src/modules/*` behind index exports; provider integrations are
separate packages with adapter isolation. Background work runs on pg-boss
in-process (ADR 0016), not a bespoke worker tier.

## Consequences

- One Dockerfile, one deployment, one DB.
- Module boundaries are convention + lint (no deep imports), not network.
- Splitting a module into a service later stays possible because boundaries
  are already explicit.

## Alternatives considered

- Microservices: operational cost, distributed transactions — rejected.
- Next app monolith without packages: spaghetti imports — rejected.
