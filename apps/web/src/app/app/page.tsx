import type { TenantContext } from "@crm/core";
import { ONBOARDING_STEP_IDS } from "@crm/core/onboarding";
import { Badge } from "@crm/design-system/components/badge";
import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import type { StepItem } from "@crm/design-system/components/steps";
import { Steps } from "@crm/design-system/components/steps";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import {
  getOnboardingChecklist,
  listChannelConnections,
  listConversationCounts,
  listMyOrganizations,
  listOrgStaleBrainEntries,
  listOrgSuggestions,
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

const PROBLEM_STATUSES = new Set(["error", "disconnected"]);

function CountRow({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 py-1 text-sm">
        <span className="underline-offset-2 hover:underline">{label}</span>
        <Badge tone="neutral">{count}</Badge>
      </Link>
    </li>
  );
}

function AttentionCard({
  connections,
  title,
}: {
  connections: Array<{ id: string; name: string; status: string }>;
  title: string;
}) {
  if (connections.length === 0) return null;
  return (
    <Card title={title}>
      <ul className="space-y-1 text-sm">
        {connections.map((c) => (
          <li key={c.id}>
            <Link href="/app/settings/channels" className="flex items-center gap-2 py-1">
              <span className="underline-offset-2 hover:underline">{c.name}</span>
              <Badge tone={c.status === "error" ? "danger" : "warning"}>{c.status}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ChecklistCard({
  steps,
  nextStep,
  t,
}: {
  /** Step id → ISO completion timestamp (truthy = done). */
  steps: Record<string, string>;
  nextStep: string | undefined;
  t: (key: string) => string;
}) {
  const nextLabel = nextStep ? t(`checklist.steps.${nextStep}`) : null;
  const items: StepItem[] = ONBOARDING_STEP_IDS.map((id) => ({
    label: t(`checklist.steps.${id}`),
    status: steps[id] ? "done" : id === nextStep ? "current" : "pending",
    href: id === nextStep ? STEP_HREFS[id] : undefined,
  }));
  return (
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
  );
}

interface HomeData {
  queue: number;
  mine: number;
  problems: Array<{ id: string; name: string; status: string }>;
  pending: number;
  stale: number;
  steps: Record<string, string>;
  nextStep: string | undefined;
  canAi: boolean;
  canChannels: boolean;
}

async function loadHomeData(ctx: TenantContext): Promise<HomeData> {
  const canAi = hasPermission(ctx.role, { ai: ["manage"] });
  const canChannels = hasPermission(ctx.role, { integrations: ["manage"] });
  const [counts, checklist, suggestions, stale, connections] = await Promise.all([
    listConversationCounts(ctx),
    getOnboardingChecklist(ctx),
    canAi ? listOrgSuggestions(ctx) : Promise.resolve([]),
    canAi ? listOrgStaleBrainEntries(ctx) : Promise.resolve([]),
    canChannels ? listChannelConnections(ctx) : Promise.resolve([]),
  ]);
  return {
    queue: counts.queue,
    mine: counts.mine,
    problems: connections
      .filter((c) => PROBLEM_STATUSES.has(c.status))
      .map((c) => ({ id: c.id, name: c.name, status: c.status })),
    pending: suggestions.filter((s) => s.status === "pending").length,
    stale: stale.length,
    steps: checklist.steps,
    nextStep: ONBOARDING_STEP_IDS.find((id) => !checklist.steps[id] && STEP_HREFS[id]),
    canAi,
    canChannels,
  };
}

function homeBlocks(d: HomeData, t: (key: string) => string): ReactNode[] {
  const blocks: ReactNode[] = [
    <Card key="waiting" title={t("waiting.title")}>
      {d.queue === 0 && d.mine === 0 ? (
        <p className="text-ink-muted text-sm">{t("waiting.empty")}</p>
      ) : (
        <ul>
          <CountRow href="/app/inbox?view=queue" label={t("waiting.queue")} count={d.queue} />
          <CountRow href="/app/inbox?view=mine" label={t("waiting.mine")} count={d.mine} />
        </ul>
      )}
    </Card>,
  ];
  if (d.canChannels) {
    blocks.push(
      <AttentionCard key="attention" title={t("attention.title")} connections={d.problems} />,
    );
  }
  if (d.canAi) {
    blocks.push(
      <Card key="ai" title={t("aiReviews.title")}>
        <ul>
          <CountRow href="/app/ai/reviews" label={t("aiReviews.pending")} count={d.pending} />
          <CountRow href="/app/ai/memory" label={t("aiReviews.stale")} count={d.stale} />
        </ul>
      </Card>,
    );
  }
  if (d.nextStep) {
    blocks.push(<ChecklistCard key="checklist" steps={d.steps} nextStep={d.nextStep} t={t} />);
  }
  return blocks;
}

/** Início "Hoje" — work surface per nav spec §3 (blocks filtered by role). */
export default async function AppPage() {
  const t = await getTranslations("dashboard");
  const ctx = await requireTenantContext();
  const [orgs, data] = await Promise.all([listMyOrganizations(ctx.userId), loadHomeData(ctx)]);
  const org = orgs.find((o) => o.organizationId === ctx.organizationId);

  return (
    <main className="max-w-page mx-auto p-8">
      <PageHeader title={t("title")} />
      <p className="text-ink-muted -mt-2 mb-4 text-sm" data-testid="org-name">
        {org?.name ?? t("orgFallback")}
      </p>
      <div className="gap-card-gap grid md:grid-cols-2">{homeBlocks(data, t)}</div>
    </main>
  );
}
