export type { EmailMessage, EmailProvider, SendEmailResult } from "./domain";
export { createEmailProvider } from "./factory";
export { ConsoleEmailProvider } from "./providers/console";
export { ResendEmailProvider } from "./providers/resend";
export { SmtpEmailProvider } from "./providers/smtp";
