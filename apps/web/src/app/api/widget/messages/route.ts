import { NotFoundError } from "@crm/core";
import { getWidgetConversation } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import type { NextRequest } from "next/server";

import { corsJson, corsOptions, rateLimit } from "../../../../lib/widget-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return corsOptions();
}

/**
 * Widget history — latest ticket + visitor-visible messages after the
 * `after` message-id cursor. The session token is the only auth.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return corsJson({ ok: false, error: "missing_token" }, { status: 400 });
  }
  if (!rateLimit(`widget:messages:${token}`, 60, 60_000)) {
    return corsJson({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  try {
    const result = await getWidgetConversation(getDb(), token, { after, limit: 50 });
    return corsJson({ ok: true, ...result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return corsJson({ ok: false, error: "unknown_session" }, { status: 404 });
    }
    captureException(error, { route: "widget.messages" });
    return corsJson({ ok: false, error: "internal" }, { status: 500 });
  }
}
