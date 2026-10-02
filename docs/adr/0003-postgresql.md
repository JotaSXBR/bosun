# 0003: PostgreSQL (18 + pgvector, Drizzle ORM)

Status: accepted

## Context

The CRM needs relational integrity, row-level security for tenant isolation,
and vector search for future AI knowledge features — one database should
cover all three.

## Decision

PostgreSQL 18 with the `pgvector` extension (pgvector 0.8.7 image), Drizzle
ORM 0.45 + drizzle-kit migrations, postgres.js driver. A dedicated
least-privileged role `crm_app` runs app queries under RLS.

## Consequences

- RLS + `SET LOCAL` gives DB-enforced tenant isolation.
- pgvector avoids a second datastore for embeddings.
- Drizzle gives typed queries without a runtime schema cost.

## Alternatives considered

- Separate vector DB (Qdrant/Weaviate): more infra for no gain yet.
- Prisma: heavier runtime, weaker RLS story — rejected.
- MySQL/SQLite: no comparable RLS/vector story — rejected.
