import { getServerEnv } from "@crm/config";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { assignableRoles, canSeeMembersPage } from "@/server/members";
import { listInvitations, listMembers, listSectors } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { MembersSection } from "./members-section";
import type { MembersLabels } from "./members-types";

export const dynamic = "force-dynamic";

type T = Awaited<ReturnType<typeof getTranslations>>;

function memberLabels(t: T): MembersLabels {
  const keys = [
    "members",
    "invite",
    "inviteTitle",
    "email",
    "role",
    "team",
    "teamNone",
    "send",
    "invited",
    "inviteLink",
    "copyLink",
    "copied",
    "pending",
    "expiresAt",
    "cancel",
    "canceled",
    "changeRole",
    "remove",
    "removeConfirm",
    "removed",
    "roleSaved",
    "you",
  ] as const;
  return Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<keyof MembersLabels, string>;
}

/**
 * Membros e convites — gate is member:create OR invitation:create (nav spec
 * §6: manager invites even though the hub item hides from them, §4).
 */
export default async function OrganizationMembersPage() {
  const ctx = await requireTenantContext();
  if (!canSeeMembersPage(ctx)) notFound();

  const [t, ts, members, invitations, teams] = await Promise.all([
    getTranslations("settings.members"),
    getTranslations("settings"),
    listMembers(ctx),
    listInvitations(ctx),
    listSectors(ctx),
  ]);
  const appUrl = getServerEnv().appUrl;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={ts("hub.items.members")}
        back={{ href: "/app/settings", label: ts("back") }}
        linkComponent={Link}
      />
      <MembersSection
        currentUserId={ctx.userId}
        canInvite={ctx.isPlatformAdmin || hasPermission(ctx.role, { invitation: ["create"] })}
        canCancel={ctx.isPlatformAdmin || hasPermission(ctx.role, { invitation: ["cancel"] })}
        canManage={ctx.isPlatformAdmin || hasPermission(ctx.role, { member: ["update"] })}
        roles={assignableRoles(ctx)}
        members={members}
        invitations={invitations.map((inv) => ({
          ...inv,
          inviteUrl: `${appUrl}/accept-invitation/${inv.id}`,
        }))}
        teams={teams.map((team) => ({ id: team.id, name: team.name }))}
        labels={memberLabels(t)}
      />
    </main>
  );
}
