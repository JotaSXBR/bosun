import "server-only";

import type { Auth } from "@crm/auth";
import { createAuth } from "@crm/auth";
import { getServerEnv } from "@crm/config";
import { resolveEmailConfig } from "@crm/core/platform";
import { getDb } from "@crm/db";
import { createEmailProvider } from "@crm/email";
import { captureException } from "@crm/observability";

let singleton: Auth | undefined;

/**
 * App-wide auth instance. The sendEmail hook resolves the mail provider per
 * send (platform_settings DB → env), so changing e-mail config in
 * /app/settings takes effect without a restart — unlike @crm/auth's getAuth,
 * which freezes the env provider (kept for seed/tests).
 */
export function getAuth(): Auth {
  if (!singleton) {
    const env = getServerEnv();
    const db = getDb();
    singleton = createAuth({
      db,
      env,
      sendEmail: async (message) => {
        let provider;
        try {
          const email = await resolveEmailConfig(db);
          provider = createEmailProvider({ email, nodeEnv: env.nodeEnv });
        } catch (error) {
          captureException(error, { component: "auth:email" });
          // Resolution/config failure must not crash auth flows — fall back
          // to env config (console provider when unconfigured).
          provider = createEmailProvider({ email: env.email, nodeEnv: env.nodeEnv });
        }
        await provider.send(message);
      },
    });
  }
  return singleton;
}
