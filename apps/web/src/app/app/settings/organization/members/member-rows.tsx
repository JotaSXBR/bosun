"use client";

import { Avatar } from "@crm/design-system/components/avatar";
import { Button } from "@crm/design-system/components/button";
import { IconButton } from "@crm/design-system/components/icon-button";
import { Select } from "@crm/design-system/components/select";
import { toast } from "@crm/design-system/components/toast";
import type { OrgRole } from "@crm/permissions";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  cancelInvitationAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/server/actions/members";

import type { InvitationRowData, MemberRowData, MembersLabels } from "./members-types";

type Action = Promise<{ ok: true; inviteUrl?: string } | { ok: false; error: string }>;

function useRunAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (action: Action, done: string) =>
    startTransition(async () => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(done);
      router.refresh();
    });
  return { isPending, run };
}

function copyInviteLink(url: string, done: string) {
  void navigator.clipboard.writeText(url);
  toast.success(done);
}

function MemberRoleCell({
  member,
  roles,
  labels,
  manageable,
}: {
  member: MemberRowData;
  roles: OrgRole[];
  labels: MembersLabels;
  manageable: boolean;
}) {
  const tRole = useTranslations("roles");
  const { isPending, run } = useRunAction();
  if (!manageable) {
    return <span className="text-ink-muted text-sm">{tRole(member.role)}</span>;
  }
  return (
    <>
      <Select
        size="sm"
        value={member.role}
        disabled={isPending}
        aria-label={labels.changeRole}
        options={roles.map((r) => ({ value: r, label: tRole(r) }))}
        onChange={(v) =>
          run(
            updateMemberRoleAction({ memberId: member.memberId, role: v as OrgRole }),
            labels.roleSaved,
          )
        }
      />
      <IconButton
        size="sm"
        variant="ghost"
        icon="trash-2"
        label={labels.remove}
        disabled={isPending}
        onClick={() => {
          if (window.confirm(labels.removeConfirm)) {
            run(removeMemberAction({ memberId: member.memberId }), labels.removed);
          }
        }}
      />
    </>
  );
}

export function MemberRow({
  member,
  roles,
  labels,
  manageable,
  self,
}: {
  member: MemberRowData;
  roles: OrgRole[];
  labels: MembersLabels;
  manageable: boolean;
  self: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3" data-testid="member-row">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={member.name} size="sm" />
        <div className="min-w-0">
          <p className="text-ink-strong truncate text-sm">
            {member.name}
            {self && <span className="text-ink-muted ml-2 text-xs">({labels.you})</span>}
          </p>
          <p className="text-ink-muted truncate text-xs">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MemberRoleCell member={member} roles={roles} labels={labels} manageable={manageable} />
      </div>
    </li>
  );
}

export function InvitationRow({
  invitation,
  canCancel,
  labels,
}: {
  invitation: InvitationRowData;
  canCancel: boolean;
  labels: MembersLabels;
}) {
  const tRole = useTranslations("roles");
  const format = useFormatter();
  const { isPending, run } = useRunAction();

  return (
    <li className="flex items-center justify-between gap-4 py-3" data-testid="invitation-row">
      <div className="min-w-0">
        <p className="text-ink-strong truncate text-sm">{invitation.email}</p>
        <p className="text-ink-muted text-xs">
          {tRole(invitation.role)}
          {invitation.teamName ? ` · ${invitation.teamName}` : ""}
          {invitation.expiresAt
            ? ` · ${labels.expiresAt} ${format.dateTime(invitation.expiresAt, { dateStyle: "short" })}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => copyInviteLink(invitation.inviteUrl, labels.copied)}
        >
          {labels.copyLink}
        </Button>
        {canCancel && (
          <IconButton
            size="sm"
            variant="ghost"
            icon="x"
            label={labels.cancel}
            disabled={isPending}
            onClick={() =>
              run(cancelInvitationAction({ invitationId: invitation.id }), labels.canceled)
            }
          />
        )}
      </div>
    </li>
  );
}
