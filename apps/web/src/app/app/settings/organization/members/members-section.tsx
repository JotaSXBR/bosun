"use client";

import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import type { OrgRole } from "@crm/permissions";
import { useState } from "react";

import { InviteDialog } from "./invite-dialog";
import { InvitationRow, MemberRow } from "./member-rows";
import type { InvitationRowData, MemberRowData, MembersLabels, TeamOption } from "./members-types";

function PendingInvitations({
  invitations,
  canCancel,
  labels,
}: {
  invitations: InvitationRowData[];
  canCancel: boolean;
  labels: MembersLabels;
}) {
  if (invitations.length === 0) return null;
  return (
    <Card title={labels.pending}>
      <ul className="divide-line-subtle divide-y">
        {invitations.map((inv) => (
          <InvitationRow key={inv.id} invitation={inv} canCancel={canCancel} labels={labels} />
        ))}
      </ul>
    </Card>
  );
}

function MembersCard({
  currentUserId,
  canInvite,
  canManage,
  roles,
  members,
  labels,
  onInvite,
}: {
  currentUserId: string;
  canInvite: boolean;
  canManage: boolean;
  roles: OrgRole[];
  members: MemberRowData[];
  labels: MembersLabels;
  onInvite: () => void;
}) {
  return (
    <Card title={labels.members}>
      {canInvite && (
        <div className="mb-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onInvite}>
            {labels.invite}
          </Button>
        </div>
      )}
      <ul className="divide-line-subtle divide-y">
        {members.map((m) => (
          <MemberRow
            key={m.memberId}
            member={m}
            roles={roles}
            labels={labels}
            manageable={canManage && m.userId !== currentUserId && m.role !== "owner"}
            self={m.userId === currentUserId}
          />
        ))}
      </ul>
    </Card>
  );
}

export function MembersSection({
  currentUserId,
  canInvite,
  canCancel,
  canManage,
  roles,
  members,
  invitations,
  teams,
  labels,
}: {
  currentUserId: string;
  canInvite: boolean;
  canCancel: boolean;
  canManage: boolean;
  roles: OrgRole[];
  members: MemberRowData[];
  invitations: InvitationRowData[];
  teams: TeamOption[];
  labels: MembersLabels;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="space-y-6" data-testid="members-section">
      <MembersCard
        currentUserId={currentUserId}
        canInvite={canInvite}
        canManage={canManage}
        roles={roles}
        members={members}
        labels={labels}
        onInvite={() => setInviteOpen(true)}
      />
      <PendingInvitations invitations={invitations} canCancel={canCancel} labels={labels} />
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        teams={teams}
        labels={labels}
      />
    </div>
  );
}
