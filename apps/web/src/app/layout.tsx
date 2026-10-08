import "@crm/ui/globals.css";

import { Toaster } from "@crm/ui/components/sonner";
import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
