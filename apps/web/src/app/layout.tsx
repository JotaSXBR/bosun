import "@crm/ui/globals.css";

import { Toaster } from "@crm/ui/components/sonner";
import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";

// Non-variable Google fonts require explicit weights.
const fontSans = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// Per-request CSP nonces are stamped at render time — every page must render
// dynamically (this is an authenticated app, so nothing was static anyway).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bosun",
  description: "Multi-tenant customer operations platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
