// Shared helpers for the public /api/widget/* endpoints — CORS for
// cross-origin embeds + a single-instance in-memory rate limiter.

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
} as const;

export function corsJson(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, { ...init, headers: { ...CORS_HEADERS, ...init?.headers } });
}

export function corsOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const buckets = new Map<string, { count: number; resetAt: number }>();
let callsSinceSweep = 0;

/**
 * Fixed-window limiter keyed by an arbitrary string (ip, session token).
 * Process-local — correct while the app runs a single instance; Redis
 * move is tracked in TODO when multi-instance lands.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (++callsSinceSweep >= 500) {
    callsSinceSweep = 0;
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Client IP for rate limiting — first XFF hop when behind a proxy. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}
