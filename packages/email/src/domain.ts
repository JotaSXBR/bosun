export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult = { id?: string };

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendEmailResult>;
}
