import type { EmailMessage, EmailProvider, SendEmailResult } from "./domain";

/** Records every message — the test/double provider. */
export class FakeEmailProvider implements EmailProvider {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<SendEmailResult> {
    this.sent.push(message);
    return Promise.resolve({ id: `fake-${this.sent.length}` });
  }
}
