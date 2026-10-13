import { PageHeader } from "@crm/design-system/templates/page-header";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { requireSession } from "@/server/tenant";

import { AccountTabs } from "./account-tabs";

/** Minha conta — user-scoped surfaces; org context is NOT required. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const t = await getTranslations("account");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={
          <Link href="/app" className="text-ink-muted text-sm">
            {t("back")}
          </Link>
        }
      />
      <AccountTabs />
      {children}
    </main>
  );
}
