import "@crm/ui/globals.css";

import { Toaster } from "@crm/ui/components/sonner";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// Per-request CSP nonces are stamped at render time — every page must render
// dynamically (this is an authenticated app, so nothing was static anyway).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM",
  description: "Multi-tenant CRM",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
