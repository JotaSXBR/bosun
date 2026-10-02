# 0012: Local S3 via RustFS

Status: accepted

## Context

Local dev needs real S3 semantics (signed URLs, bucket ops) without cloud
credentials; MinIO's licensing/direction made it less attractive.

## Decision

RustFS 1.0.0 in `docker/compose.yml` (S3 API on :9000, console :9001).
`pnpm storage:init` creates the bucket; the app talks through
`@crm/storage`'s `S3StorageProvider` with a custom endpoint + path-style
URLs — the same code path used for real S3 in production.

## Consequences

- Offline dev with production-parity behavior; the integration test exercises
  RustFS directly.
- Credentials are env-driven (`STORAGE_S3_*`) — no local-only code paths.
- If RustFS disappoints, swap the compose service for MinIO/LocalStack —
  app code doesn't change.

## Alternatives considered

- MinIO: heavier and moving away from community features — deferred.
- Fake in-memory for dev: hides real signed-URL/behavior issues — rejected.
