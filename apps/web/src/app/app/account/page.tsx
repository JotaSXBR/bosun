import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { getTranslations } from "next-intl/server";

import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const t = await getTranslations("account");
  await requireTenantContext();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader title={t("title")} />
      <EmptyState icon="user" title={t("emptyTitle")} body={t("emptyBody")} />
    </main>
  );
}
