"use client";

import { Button } from "@crm/design-system/components/button";
import { Dialog } from "@crm/design-system/components/dialog";
import { Input } from "@crm/design-system/components/input";
import { Select } from "@crm/design-system/components/select";
import { toast } from "@crm/design-system/components/toast";
import type { OrgRole } from "@crm/permissions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { inviteMemberAction } from "@/server/actions/members";

import type { MembersLabels, TeamOption } from "./members-types";

function useInviteSubmit(labels: MembersLabels) {
  const router = useRouter();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submit = (input: { email: string; role: OrgRole; teamId: string | null }) =>
    startTransition(async () => {
      const result = await inviteMemberAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(labels.invited);
      setInviteUrl(result.inviteUrl ?? null);
      router.refresh();
    });
  return { inviteUrl, isPending, submit };
}

function InviteFields({
  email,
  role,
  teamId,
  roles,
  teams,
  labels,
  onEmail,
  onRole,
  onTeam,
}: {
  email: string;
  role: OrgRole;
  teamId: string;
  roles: OrgRole[];
  teams: TeamOption[];
  labels: MembersLabels;
  onEmail: (v: string) => void;
  onRole: (v: OrgRole) => void;
  onTeam: (v: string) => void;
}) {
  const tRole = useTranslations("roles");
  const roleOptions = roles.map((r) => ({ value: r, label: tRole(r) }));
  const teamOptions = [
    { value: "none", label: labels.teamNone },
    ...teams.map((t) => ({ value: t.id, label: t.name })),
  ];
  return (
    <>
      <Input
        shape="rounded"
        type="email"
        icon="at-sign"
        placeholder={labels.email}
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        aria-label={labels.email}
      />
      <Select
        value={role}
        onChange={(v) => onRole(v as OrgRole)}
        aria-label={labels.role}
        options={roleOptions}
      />
      <Select value={teamId} onChange={onTeam} aria-label={labels.team} options={teamOptions} />
    </>
  );
}

export function InviteDialog({
  open,
  onClose,
  roles,
  teams,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  roles: OrgRole[];
  teams: TeamOption[];
  labels: MembersLabels;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("agent");
  const [teamId, setTeamId] = useState("none");
  const { inviteUrl, isPending, submit } = useInviteSubmit(labels);

  return (
    <Dialog open={open} onClose={onClose} title={labels.inviteTitle}>
      <div className="space-y-4">
        <InviteFields
          email={email}
          role={role}
          teamId={teamId}
          roles={roles}
          teams={teams}
          labels={labels}
          onEmail={setEmail}
          onRole={setRole}
          onTeam={setTeamId}
        />
        {inviteUrl && (
          <div className="space-y-1">
            <p className="text-ink-muted text-xs">{labels.inviteLink}</p>
            <Input shape="rounded" readOnly value={inviteUrl} data-testid="invite-url" />
          </div>
        )}
        <Button
          variant="primary"
          fullWidth
          loading={isPending}
          disabled={!email.includes("@")}
          onClick={() => submit({ email, role, teamId: teamId === "none" ? null : teamId })}
        >
          {inviteUrl ? labels.invite : labels.send}
        </Button>
      </div>
    </Dialog>
  );
}
