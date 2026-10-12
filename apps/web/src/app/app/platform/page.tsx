import { Card } from "@crm/design-system/components/card";
import { Icon } from "@crm/design-system/components/icon";
import { PageHeader } from "@crm/design-system/templates/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getPlatformSettings } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const t = await getTranslations("platform");
  const ts = await getTranslations("settings");
  const ctx = await requireTenantContext();
  if (!ctx.isPlatformAdmin) notFound();

  const summaries = await getPlatformSettings(ctx);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader title={t("title")} />
      <Card title={ts("platform.title")}>
        <ul className="divide-line-subtle -mx-2 divide-y">
          {summaries.map((summary) => (
            <li key={summary.group}>
              <Link
                href={`/app/platform/${summary.group}`}
                className="hover:bg-control-hover focus-visible:shadow-focus flex items-center gap-3 rounded-md px-2 py-3 outline-none"
              >
                <span className="flex-1">
                  <span className="text-ui text-ink-strong block font-medium">
                    {ts(`platform.groups.${summary.group}.title`)}
                  </span>
                  <span className="text-ink-muted text-sm">
                    {ts(`platform.groups.${summary.group}.description`)}
                  </span>
                </span>
                <span
                  className={summary.configured ? "text-success text-xs" : "text-ink-muted text-xs"}
                >
                  {ts(summary.configured ? "platform.configured" : "platform.notConfigured")}
                </span>
                <Icon name="chevron-right" size={16} className="text-icon-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
