const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Builds a tenant-scoped object key: `org/<organizationId>/<segments...>`.
 * ALL tenant files MUST be stored under a key built by this function.
 * Throws on anything unsafe: bad uuid, empty/`..` segments, leading slashes,
 * backslashes, or characters outside [A-Za-z0-9._-].
 */
export function tenantObjectKey(organizationId: string, ...segments: string[]): string {
  if (!UUID_RE.test(organizationId)) {
    throw new Error(`tenantObjectKey: invalid organization id "${organizationId}"`);
  }
  if (segments.length === 0) {
    throw new Error("tenantObjectKey: at least one path segment is required");
  }
  for (const segment of segments) {
    if (
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      segment.includes("\\") ||
      segment.includes("/") ||
      !SAFE_SEGMENT.test(segment)
    ) {
      throw new Error(`tenantObjectKey: unsafe segment "${segment}"`);
    }
  }
  return `org/${organizationId}/${segments.join("/")}`;
}
