import type { ReactNode } from "react";

import { InboxLive } from "@/components/inbox-live";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <InboxLive />
    </>
  );
}
