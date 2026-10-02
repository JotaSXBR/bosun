// Resend adapter — direct HTTP (POST https://api.resend.com/emails), no SDK.
import { z } from "zod";

import type { EmailMessage, EmailProvider, SendEmailResult } from "../domain";

export type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

const resendResponseSchema = z.looseObject({ id: z.string().optional() });

export class ResendEmailProvider implements EmailProvider {
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly config: { apiKey: string; from: string },
    deps?: { fetch?: FetchLike },
  ) {
    this.fetchImpl = deps?.fetch ?? fetch;
  }

  async send(message: EmailMessage): Promise<SendEmailResult> {
    const res = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed: HTTP ${res.status} ${await res.text()}`);
    }
    return { id: resendResponseSchema.parse(await res.json()).id };
  }
}
