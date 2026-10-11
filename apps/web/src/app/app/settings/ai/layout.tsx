import { Card } from "@crm/design-system/components/card";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { requireTenantContext } from "@/server/tenant";

import { AiTabs } from "./ai-tabs";

export default async function AiLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("settings.ai");
  const ts = await getTranslations("settings");
  const ctx = await requireTenantContext();
  const allowed = hasPermission(ctx.role, { ai: ["read"] });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={
          <Link href="/app/settings" className="text-ink-muted text-sm">
            {ts("back")}
          </Link>
        }
      />
      {allowed ? (
        <>
          <AiTabs />
          {children}
        </>
      ) : (
        <Card bodyClassName="text-ink-muted p-6 text-sm">{t("restricted")}</Card>
      )}
    </main>
  );
}
