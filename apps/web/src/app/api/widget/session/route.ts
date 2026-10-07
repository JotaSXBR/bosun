import { NotFoundError } from "@crm/core";
import { createWidgetSession, widgetPreFormInput } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { clientIp, corsJson, corsOptions, rateLimit } from "../../../../lib/widget-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionCreateInput = widgetPreFormInput.extend({
  connectionToken: z.string().min(1).max(128),
});

export function OPTIONS(): Response {
  return corsOptions();
}

/**
 * Public widget session bootstrap — the embed token identifies the
 * connection (it is public by design, like a Site-Key); the pre-form
 * identifies the visitor. Rate-limited per client IP.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!rateLimit(`widget:session:${clientIp(request)}`, 10, 60_000)) {
    return corsJson({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return corsJson({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = sessionCreateInput.safeParse(body);
  if (!parsed.success) {
    return corsJson({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  try {
    const session = await createWidgetSession(getDb(), parsed.data.connectionToken, parsed.data);
    return corsJson({ ok: true, ...session });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return corsJson({ ok: false, error: "unknown_connection" }, { status: 404 });
    }
    captureException(error, { route: "widget.session" });
    return corsJson({ ok: false, error: "internal" }, { status: 500 });
  }
}
