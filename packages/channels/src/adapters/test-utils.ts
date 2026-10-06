// Shared test helpers for adapter tests.
import { createHmac } from "node:crypto";

import type { RawWebhookRequest } from "../domain";
import type { FetchLike } from "./waha";

export function hmacSha512(body: string, secret: string): string {
  return createHmac("sha512", secret).update(body).digest("hex");
}

export function wahaRequest(payload: unknown, secret?: string): RawWebhookRequest {
  const rawBody = JSON.stringify(payload);
  return {
    rawBody,
    headers: secret ? { "x-webhook-hmac": hmacSha512(rawBody, secret) } : {},
    query: {},
  };
}

type MockFetchCall = {
  url: string;
  init?: { method?: string; headers?: Record<string, string>; body?: string };
};

export function mockFetch(
  responder: (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ) => {
    status?: number;
    json?: unknown;
  },
): {
  fetch: FetchLike;
  calls: MockFetchCall[];
} {
  const calls: MockFetchCall[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    calls.push({ url, init });
    const res = responder(url, init);
    return Promise.resolve({
      ok: (res.status ?? 200) >= 200 && (res.status ?? 200) < 300,
      status: res.status ?? 200,
      headers: { get: () => null },
      json: () => Promise.resolve(res.json),
      text: () => Promise.resolve(JSON.stringify(res.json)),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
  };
  return { fetch: fetchImpl, calls };
}
