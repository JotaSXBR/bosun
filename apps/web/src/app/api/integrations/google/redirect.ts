import { getServerEnv } from "@crm/config";

/**
 * The OAuth redirect URI the org registers in its Google Cloud client.
 * Built from APP_URL (never from request headers) so the value sent to
 * Google at consent and at code exchange is always identical.
 */
export function googleRedirectUri(): string {
  return `${getServerEnv().appUrl}/api/integrations/google/callback`;
}
