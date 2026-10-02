# 0009: Storage abstraction

Status: accepted

## Context

Uploads must work locally without AWS and in production on any S3-compatible
service; tenant data must never share object namespaces.

## Decision

`@crm/storage` exposes `StorageProvider` (upload/download/delete/signed URLs)
implemented by `S3StorageProvider` (AWS SDK v3, custom endpoint +
path-style for RustFS) and `InMemoryStorageProvider` for tests. All tenant
files go through `tenantObjectKey(organizationId, ...)` →
`org/<uuid>/<path>`, which rejects traversal.

## Consequences

- `pnpm storage:init` creates the local bucket; prod just points
  `STORAGE_S3_*` elsewhere.
- Key convention makes cross-tenant listing/overwrite impossible by
  construction.
- Signed URLs avoid proxying bytes through the app.

## Alternatives considered

- Filesystem storage: doesn't scale beyond one node — rejected.
- DB blobs: wrong tool — rejected.
