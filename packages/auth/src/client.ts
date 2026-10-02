import { ac, roles } from "@crm/permissions";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export function createClient(baseURL?: string) {
  return createAuthClient({
    baseURL,
    plugins: [organizationClient({ ac, roles }), adminClient()],
  });
}

export type AuthClient = ReturnType<typeof createClient>;
