import { createLogger } from "@crm/observability";

import type { EmailMessage, EmailProvider, SendEmailResult } from "../domain";

const logger = createLogger({ bindings: { component: "email" } });

/**
 * Logs outbound mail instead of sending — the local development default.
 * The body is only logged outside production.
 */
export class ConsoleEmailProvider implements EmailProvider {
  constructor(private readonly exposeBody: boolean = process.env.NODE_ENV !== "production") {}

  send(message: EmailMessage): Promise<SendEmailResult> {
    logger.info("email.send (console)", {
      to: message.to,
      subject: message.subject,
      ...(this.exposeBody ? { text: message.text } : {}),
    });
    return Promise.resolve({});
  }
}
