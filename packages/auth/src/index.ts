import { getServerEnv } from "@crm/config";
import { getDb } from "@crm/db";
import { createEmailProvider } from "@crm/email";

import type { Auth } from "./auth";
import { createAuth } from "./auth";

export type { Auth, AuthOptions, EmailMessage, Session } from "./auth";
export { createAuth } from "./auth";

let singleton: Auth | undefined;

/** Lazy app-wide auth instance (uses env + DATABASE_URL). */
export function getAuth(): Auth {
  if (!singleton) {
    const env = getServerEnv();
    const email = createEmailProvider(env);
    singleton = createAuth({
      db: getDb(),
      env,
      sendEmail: async (message) => {
        await email.send(message);
      },
    });
  }
  return singleton;
}
