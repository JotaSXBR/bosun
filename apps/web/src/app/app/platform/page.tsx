import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const t = await getTranslations("platform");
  const ctx = await requireTenantContext();
  if (!ctx.isPlatformAdmin) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader title={t("title")} />
      <EmptyState icon="shield-check" title={t("emptyTitle")} body={t("emptyBody")} />
    </main>
  );
}
