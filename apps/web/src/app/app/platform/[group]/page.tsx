import { PageHeader } from "@crm/design-system/templates/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PlatformGroupCard } from "@/app/app/platform/platform-settings";
import { getPlatformSettings } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

/** One platform settings group per route — /app/platform/{email,billing,meta,ai}. */
export default async function PlatformGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const ts = await getTranslations("settings");
  const ctx = await requireTenantContext();
  if (!ctx.isPlatformAdmin) notFound();

  const summary = (await getPlatformSettings(ctx)).find((s) => s.group === group);
  if (!summary) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={ts(`platform.groups.${summary.group}.title`)}
        back={{ href: "/app/platform", label: ts("back") }}
        linkComponent={Link}
      />
      <PlatformGroupCard summary={summary} />
      {summary.group === "email" ? (
        <Link href="/app/setup" className="text-ink-muted text-sm hover:underline">
          {ts("platform.guidedSetup")} →
        </Link>
      ) : null}
    </main>
  );
}
