import { Card } from "@crm/ui/components/card";
import { PageHeader } from "@crm/ui/templates/page-header";
import { getTranslations } from "next-intl/server";

import { listMyOrganizations, listRecentAuditEvents } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const t = await getTranslations("dashboard");
  const ctx = await requireTenantContext();
  const orgs = await listMyOrganizations(ctx.userId);
  const org = orgs.find((o) => o.organizationId === ctx.organizationId);
  const canReadAudit = ctx.isPlatformAdmin || ctx.role !== "agent";
  const events = canReadAudit ? await listRecentAuditEvents(ctx, { limit: 10 }) : [];

  return (
    <main className="max-w-page mx-auto p-8">
      <PageHeader title={<span data-testid="org-name">{org?.name ?? t("orgFallback")}</span>} />
      <div className="gap-card-gap grid md:grid-cols-2">
        <Card bodyClassName="space-y-1 text-sm" title={t("account")}>
          <p>
            <span className="text-ink-muted">{t("user")}</span> {ctx.userId}
          </p>
          <p>
            <span className="text-ink-muted">{t("role")}</span> {ctx.role}
            {ctx.isPlatformAdmin ? ` ${t("platformAdminSuffix")}` : ""}
          </p>
        </Card>
        <Card title={t("recentActivity")}>
          {events.length === 0 ? (
            <p className="text-ink-muted text-sm">{t("noEvents")}</p>
          ) : (
            <ul className="space-y-1 text-sm" data-testid="audit-list">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between gap-4">
                  <span>{event.action}</span>
                  <span className="text-ink-muted">{event.createdAt.toISOString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
