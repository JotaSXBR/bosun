import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SignOutButton } from "@/components/sign-out-button";
import { listMyOrganizations, listRecentAuditEvents } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const t = await getTranslations("dashboard");
  const tn = await getTranslations("nav");
  const ctx = await requireTenantContext();
  const orgs = await listMyOrganizations(ctx.userId);
  const org = orgs.find((o) => o.organizationId === ctx.organizationId);
  const canReadAudit = ctx.isPlatformAdmin || ctx.role !== "agent";
  const events = canReadAudit ? await listRecentAuditEvents(ctx, { limit: 10 }) : [];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="org-name">
          {org?.name ?? t("orgFallback")}
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/app/inbox" className="text-muted-foreground text-sm underline">
            {tn("inbox")}
          </Link>
          <Link href="/app/integrations" className="text-muted-foreground text-sm underline">
            {tn("integrations")}
          </Link>
          <Link href="/app/settings" className="text-muted-foreground text-sm underline">
            {tn("settings")}
          </Link>
          <SignOutButton />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">{t("user")}</span> {ctx.userId}
          </p>
          <p>
            <span className="text-muted-foreground">{t("role")}</span> {ctx.role}
            {ctx.isPlatformAdmin ? ` ${t("platformAdminSuffix")}` : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noEvents")}</p>
          ) : (
            <ul className="space-y-1 text-sm" data-testid="audit-list">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between gap-4">
                  <span>{event.action}</span>
                  <span className="text-muted-foreground">{event.createdAt.toISOString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
