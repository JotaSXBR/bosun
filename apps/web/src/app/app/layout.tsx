import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { InboxLive } from "@/components/inbox-live";
import { loadShellAlerts } from "@/server/alerts";
import { listMyOrganizations } from "@/server/services";
import { getTenantContext, requireSession } from "@/server/tenant";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const t = await getTranslations("nav");
  // getTenantContext (never requireTenantContext): /app/setup lives inside
  // this layout and the wizard gate must not redirect from here.
  const [ctx, organizations] = await Promise.all([
    getTenantContext(),
    listMyOrganizations(session.user.id),
  ]);
  const alerts = ctx ? await loadShellAlerts(ctx, t) : [];

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
        alerts={alerts}
      >
        {children}
      </AppShell>
      <InboxLive />
    </>
  );
}
