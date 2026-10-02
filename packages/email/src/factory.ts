import type { ServerEnv } from "@crm/config";

import type { EmailProvider } from "./domain";
import { ConsoleEmailProvider } from "./providers/console";
import type { FetchLike } from "./providers/resend";
import { ResendEmailProvider } from "./providers/resend";
import { SmtpEmailProvider } from "./providers/smtp";

/**
 * Picks the email provider from EMAIL_PROVIDER (env-driven) and fails fast
 * when the selected provider is missing configuration.
 */
export function createEmailProvider(
  env: Pick<ServerEnv, "email" | "nodeEnv">,
  deps?: { fetch?: FetchLike },
): EmailProvider {
  const { email } = env;
  const from = email.from;
  switch (email.provider) {
    case "console":
      return new ConsoleEmailProvider(env.nodeEnv !== "production");
    case "resend": {
      if (!from || !email.resendApiKey) {
        throw new Error("EMAIL_PROVIDER=resend requires EMAIL_FROM and RESEND_API_KEY");
      }
      return new ResendEmailProvider({ apiKey: email.resendApiKey, from }, deps);
    }
    case "smtp": {
      if (!from || !email.smtp.host || !email.smtp.port) {
        throw new Error("EMAIL_PROVIDER=smtp requires EMAIL_FROM, SMTP_HOST and SMTP_PORT");
      }
      return new SmtpEmailProvider({
        host: email.smtp.host,
        port: email.smtp.port,
        user: email.smtp.user,
        password: email.smtp.password,
        secure: email.smtp.secure,
        from,
      });
    }
  }
}
