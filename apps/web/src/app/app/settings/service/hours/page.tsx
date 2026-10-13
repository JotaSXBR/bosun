import { businessHoursSchema } from "@crm/core/organizations";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getOrgSettings } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { HoursForm } from "./hours-form";

export const dynamic = "force-dynamic";

export default async function ServiceHoursPage() {
  const t = await getTranslations("settings");
  const ti = await getTranslations("settings.hub.items");
  const ctx = await requireTenantContext();
  if (!hasPermission(ctx.role, { organization: ["update"] })) notFound();
  const settings = await getOrgSettings(ctx);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={ti("hours")}
        back={{ href: "/app/settings", label: t("back") }}
        linkComponent={Link}
      />
      <HoursForm
        businessHours={businessHoursSchema.parse(settings.businessHours)}
        offHoursMessage={settings.offHoursMessage}
        timezone={settings.timezone}
      />
    </main>
  );
}
