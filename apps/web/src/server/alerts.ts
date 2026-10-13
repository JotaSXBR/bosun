import type { TenantContext } from "@crm/core";
import type { TransferToMeRow } from "@crm/core/messaging";
import { hasPermission } from "@crm/permissions";
import type { getTranslations } from "next-intl/server";

import type { ShellAlert } from "@/components/app-shell-menu";
import {
  listChannelConnections,
  listMyTransfers,
  listOrgStaleBrainEntries,
  listOrgSuggestions,
} from "@/server/services";

const PROBLEM_STATUSES = new Set(["error", "disconnected"]);

type NavT = Awaited<ReturnType<typeof getTranslations>>;

/**
 * Bell items (nav spec §3) — derived from existing data, no notification
 * table: pending AI reviews + stale memories (ai:manage), unhealthy channel
 * connections (integrations:manage) and transfer notes addressed to the
 * user (messaging:read, i.e. everyone with org access).
 */
export async function loadShellAlerts(ctx: TenantContext, t: NavT): Promise<ShellAlert[]> {
  const canAi = hasPermission(ctx.role, { ai: ["manage"] });
  const canChannels = hasPermission(ctx.role, { integrations: ["manage"] });
  const [suggestions, stale, connections, transfers] = await Promise.all([
    canAi ? listOrgSuggestions(ctx) : Promise.resolve([]),
    canAi ? listOrgStaleBrainEntries(ctx) : Promise.resolve([]),
    canChannels ? listChannelConnections(ctx) : Promise.resolve([]),
    listMyTransfers(ctx),
  ]);

  const pending = suggestions.filter((s) => s.status === "pending").length;
  return [
    ...aiAlerts(pending, stale.length, t),
    ...connectionAlerts(connections, t),
    ...transferAlerts(transfers, t),
  ];
}

function aiAlerts(pending: number, stale: number, t: NavT): ShellAlert[] {
  const alerts: ShellAlert[] = [];
  if (pending > 0) {
    alerts.push({
      key: "ai-reviews",
      icon: "sparkles",
      href: "/app/ai/reviews",
      label: t("alertAiReviews", { count: pending }),
    });
  }
  if (stale > 0) {
    alerts.push({
      key: "ai-stale",
      icon: "sparkles",
      href: "/app/ai/memory",
      label: t("alertStaleMemories", { count: stale }),
    });
  }
  return alerts;
}

function connectionAlerts(
  connections: Array<{ id: string; name: string; status: string }>,
  t: NavT,
): ShellAlert[] {
  return connections
    .filter((c) => PROBLEM_STATUSES.has(c.status))
    .map((c) => ({
      key: `connection-${c.id}`,
      icon: "triangle-alert" as const,
      href: "/app/settings/channels",
      label: t("alertConnection", { name: c.name }),
    }));
}

function transferAlerts(transfers: TransferToMeRow[], t: NavT): ShellAlert[] {
  return transfers.map((tr) => ({
    key: `transfer-${tr.conversationId}-${tr.createdAt.getTime()}`,
    icon: "inbox" as const,
    href: `/app/inbox?view=mine&c=${tr.conversationId}`,
    label: tr.authorName
      ? t("alertTransferBy", { author: tr.authorName, ticket: tr.ticketNumber })
      : t("alertTransfer", { ticket: tr.ticketNumber }),
  }));
}
