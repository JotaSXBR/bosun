import { DomainError, WebhookVerificationError } from "@crm/core";
import { handleAsaasWebhook } from "@crm/core/billing";
import { getDb } from "@crm/db";
import { captureException, createLogger } from "@crm/observability";
import type { NextRequest } from "next/server";

const logger = createLogger({ bindings: { component: "billing-webhook" } });

/**
 * ASAAS webhook for platform billing (the platform charging organizations).
 * Auth is the shared `asaas-access-token` header against ASAAS_WEBHOOK_TOKEN;
 * idempotency is the billing_webhook_events.event_id unique index — replays
 * are acknowledged with { ok: true, duplicate: true }, never retried.
 */
export async function POST(request: NextRequest): Promise<Response> {
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
    const result = await handleAsaasWebhook(getDb(), { rawBody, headers, query });
    return Response.json(result);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ ok: false }, { status: 401 });
    }
    if (error instanceof DomainError && error.code === "INVALID_WEBHOOK_PAYLOAD") {
      return Response.json({ ok: false }, { status: 400 });
    }
    captureException(error, { route: "webhooks.billing.asaas" });
    logger.error("billing webhook failed", { error: (error as Error).message });
    return Response.json({ ok: false }, { status: 500 });
  }
}
