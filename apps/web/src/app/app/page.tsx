import { ONBOARDING_STEP_IDS } from "@crm/core/onboarding";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import type { StepItem } from "@crm/design-system/components/steps";
import { Steps } from "@crm/design-system/components/steps";
import { PageHeader } from "@crm/design-system/templates/page-header";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getOnboardingChecklist,
  listMyOrganizations,
  listRecentAuditEvents,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

const STEP_HREFS: Record<string, string | undefined> = {
  connect_channel: "/app/settings/channels",
  create_team: "/app/settings/service/teams",
  create_funnel: "/app/settings/sales/funnels",
  first_conversation: "/app/inbox",
};

export default async function AppPage() {
  const t = await getTranslations("dashboard");
  const ctx = await requireTenantContext();
  const orgs = await listMyOrganizations(ctx.userId);
  const org = orgs.find((o) => o.organizationId === ctx.organizationId);
  const canReadAudit = ctx.isPlatformAdmin || ctx.role !== "agent";
  const events = canReadAudit ? await listRecentAuditEvents(ctx, { limit: 10 }) : [];

  const checklist = await getOnboardingChecklist(ctx);
  const nextStep = ONBOARDING_STEP_IDS.find((id) => !checklist.steps[id] && STEP_HREFS[id]);
  const nextLabel = nextStep ? t(`checklist.steps.${nextStep}`) : null;
  const items: StepItem[] = ONBOARDING_STEP_IDS.map((id) => ({
    label: t(`checklist.steps.${id}`),
    status: checklist.steps[id] ? "done" : id === nextStep ? "current" : "pending",
    href: id === nextStep ? STEP_HREFS[id] : undefined,
  }));

  return (
    <main className="max-w-page mx-auto p-8">
      <PageHeader title={<span data-testid="org-name">{org?.name ?? t("orgFallback")}</span>} />
      <div className="gap-card-gap grid md:grid-cols-2">
        <Card
          title={t("checklist.title")}
          subtitle={t("checklist.subtitle")}
          actions={
            nextStep && nextLabel ? (
              <Button variant="primary" asChild>
                <Link href={STEP_HREFS[nextStep]!}>{nextLabel}</Link>
              </Button>
            ) : undefined
          }
        >
          <Steps items={items} linkComponent={Link} doneLabel={t("checklist.done")} />
        </Card>
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
