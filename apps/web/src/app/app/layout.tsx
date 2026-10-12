import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { InboxLive } from "@/components/inbox-live";
import { listMyOrganizations } from "@/server/services";
import { getTenantContext, requireSession } from "@/server/tenant";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  // getTenantContext (never requireTenantContext): /app/setup lives inside
  // this layout and the wizard gate must not redirect from here.
  const [ctx, organizations] = await Promise.all([
    getTenantContext(),
    listMyOrganizations(session.user.id),
  ]);

  return (
    <>
      <AppShell
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        role={ctx?.role ?? null}
        isPlatformAdmin={ctx?.isPlatformAdmin ?? false}
        currentOrganizationId={ctx?.organizationId ?? null}
        organizations={organizations}
      >
        {children}
      </AppShell>
      <InboxLive />
    </>
  );
}
