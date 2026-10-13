import { Card } from "@crm/design-system/components/card";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { listRecentAuditEvents } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

export const dynamic = "force-dynamic";

/** Org audit trail — the raw list moved out of Início (nav spec §3). */
export default async function OrganizationAuditPage() {
  const t = await getTranslations("settings.hub.items");
  const ts = await getTranslations("settings");
  const td = await getTranslations("dashboard");
  const format = await getFormatter();
  const ctx = await requireTenantContext();
  if (!hasPermission(ctx.role, { audit: ["read"] })) notFound();
  const events = await listRecentAuditEvents(ctx, { limit: 50 });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("audit")}
        back={{ href: "/app/settings", label: ts("back") }}
        linkComponent={Link}
      />
      <Card title={td("recentActivity")}>
        {events.length === 0 ? (
          <p className="text-ink-muted text-sm">{td("noEvents")}</p>
        ) : (
          <ul className="space-y-1 text-sm" data-testid="audit-list">
            {events.map((event) => (
              <li key={event.id} className="flex justify-between gap-4">
                <span>{event.action}</span>
                <span className="text-ink-muted">
                  {format.dateTime(event.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
