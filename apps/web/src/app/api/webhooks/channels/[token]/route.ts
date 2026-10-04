import { enqueueChannelEventProcessed } from "@crm/automation";
import { NotFoundError, WebhookVerificationError } from "@crm/core";
import { ingestChannelWebhook } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { captureException, createLogger } from "@crm/observability";
import type { NextRequest } from "next/server";

const logger = createLogger({ bindings: { component: "channel-webhook" } });

/**
 * Channel webhook ingestion. The path token is the only routing credential:
 * it resolves the connection under service scope, the provider signature is
 * verified on the raw body, and only then are events normalized and persisted
 * inside the connection's tenant. Always 200 after verification — unknown or
 * duplicate events are acknowledged, not retried.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const rawBody = await request.text();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const query: Record<string, string> = {};
  new URL(request.url).searchParams.forEach((value, key) => {
    query[key] = value;
  });

  try {
    const result = await ingestChannelWebhook(getDb(), token, { rawBody, headers, query });
    if (result.processed.length === 0) {
      logger.warn("channel webhook carried no recognized events", {
        channelConnectionId: result.channelConnectionId,
      });
    }
    for (const event of result.processed) {
      await enqueueChannelEventProcessed({
        organizationId: result.organizationId,
        channelConnectionId: result.channelConnectionId,
        eventType: event.eventType,
        ...(event.messageId ? { messageId: event.messageId } : {}),
      });
    }
    return Response.json({ ok: true, processed: result.processed.length });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ ok: false }, { status: 404 });
    }
    if (error instanceof WebhookVerificationError) {
      return Response.json({ ok: false }, { status: 401 });
    }
    captureException(error, { route: "webhooks.channels" });
    logger.error("channel webhook failed", { error: (error as Error).message });
    return Response.json({ ok: false }, { status: 500 });
  }
}
