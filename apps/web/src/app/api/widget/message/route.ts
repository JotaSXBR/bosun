import { enqueueChannelEventProcessed } from "@crm/automation";
import { NotFoundError } from "@crm/core";
import { sendWidgetMessage } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { corsJson, corsOptions, rateLimit } from "../../../../lib/widget-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const widgetMessageInput = z.object({
  sessionToken: z.string().min(1).max(128),
  text: z.string().min(1).max(4000),
  clientMessageId: z.string().min(1).max(64).optional(),
});

export function OPTIONS(): Response {
  return corsOptions();
}

/**
 * Public widget inbound — session token authorizes writing as the visitor;
 * the message runs the standard ingest pipeline (off-hours auto-reply and
 * the process-channel-event job come for free).
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return corsJson({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = widgetMessageInput.safeParse(body);
  if (!parsed.success) {
    return corsJson({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!rateLimit(`widget:message:${parsed.data.sessionToken}`, 30, 60_000)) {
    return corsJson({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  try {
    await sendWidgetMessage(
      getDb(),
      parsed.data.sessionToken,
      { text: parsed.data.text, clientMessageId: parsed.data.clientMessageId },
      { enqueue: (executor, payload) => enqueueChannelEventProcessed(payload, executor) },
    );
    return corsJson({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return corsJson({ ok: false, error: "unknown_session" }, { status: 404 });
    }
    captureException(error, { route: "widget.message" });
    return corsJson({ ok: false, error: "internal" }, { status: 500 });
  }
}
