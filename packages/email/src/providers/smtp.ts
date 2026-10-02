import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";

import type { EmailMessage, EmailProvider, SendEmailResult } from "../domain";

export type SmtpConfig = {
  host: string;
  port: number;
  user?: string | undefined;
  password?: string | undefined;
  secure?: boolean | undefined;
  from: string;
};

export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(
    private readonly config: SmtpConfig,
    transporter?: Transporter,
  ) {
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? config.port === 465,
        ...(config.user ? { auth: { user: config.user, pass: config.password } } : {}),
      });
  }

  async send(message: EmailMessage): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return { id: info.messageId };
  }
}
