import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { InboxLive } from "@/components/inbox-live";
import { requireSession } from "@/server/tenant";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <AppShell
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      >
        {children}
      </AppShell>
      <InboxLive />
    </>
  );
}
