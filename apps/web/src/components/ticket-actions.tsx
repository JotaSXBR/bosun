"use client";

import type { ConversationDetailRow } from "@crm/core/messaging";
import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { Button } from "@crm/design-system/components/button";
import { Select } from "@crm/design-system/components/select";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  pickupConversationAction,
  reopenTicketAction,
  resolveConversationAction,
  resumeTicketAction,
  setConversationInProgressAction,
  setConversationWaitingAction,
  snoozeConversationAction,
  transferConversationAction,
} from "@/server/actions/messaging";

type ActionResult = { ok: true } | { ok: false; error: string };

export function TicketActions({
  conversation,
  userId,
  members,
  sectors,
  canWork,
  isResolved,
  isClosed,
  isViewer,
}: {
  conversation: ConversationDetailRow;
  userId: string;
  members: OrgMember[];
  sectors: TeamWithMembers[];
  canWork: boolean;
  isResolved: boolean;
  isClosed: boolean;
  isViewer: boolean;
}) {
  const t = useTranslations("tickets");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<string>();

  if (isViewer) return null;

  // Work actions belong to the assignee; another agent's path is Transfer.
  const ownsTicket = conversation.assigneeId === null || conversation.assigneeId === userId;
  // Viewers can never work a ticket — no point offering them as targets.
  const agents = members.filter((m) => m.role !== "viewer");

  const run = (action: Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });

  const conversationId = conversation.id;

  const doTransfer = () => {
    if (!target) return;
    const [kind, id] = target.split(":");
    void run(
      transferConversationAction(
        kind === "user" ? { conversationId, assigneeId: id! } : { conversationId, sectorId: id! },
      ),
    );
    setTarget("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4" data-testid="ticket-actions">
      {isResolved && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(reopenTicketAction({ conversationId }))}
        >
          {t("reopen")}
        </Button>
      )}

      {isClosed && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(resumeTicketAction({ conversationId }))}
        >
          {t("newService")}
        </Button>
      )}

      {canWork && !ownsTicket && (
        <span className="text-ink-muted text-sm">
          {t("inServiceBy", { name: conversation.assigneeName ?? "?" })}
        </span>
      )}

      {canWork && ownsTicket && (
        <>
          <WorkButtons conversation={conversation} pending={pending} run={run} t={t} />
          <SnoozeControl conversation={conversation} pending={pending} run={run} t={t} />
        </>
      )}

      {canWork && (
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: "__hdr_agents", label: t("agents"), disabled: true },
              ...agents.map((m) => ({ value: `user:${m.userId}`, label: m.name })),
              { value: "__hdr_sectors", label: t("sectors"), disabled: true },
              ...sectors.map((s) => ({ value: `sector:${s.id}`, label: s.name })),
            ]}
            value={target}
            onChange={setTarget}
            placeholder={t("transferPlaceholder")}
            aria-label={t("transferTo")}
            disabled={pending}
            className="w-52"
          />
          <Button variant="secondary" disabled={pending || !target} onClick={doTransfer}>
            {t("transfer")}
          </Button>
        </div>
      )}
    </div>
  );
}

function WorkButtons({
  conversation,
  pending,
  run,
  t,
}: {
  conversation: ConversationDetailRow;
  pending: boolean;
  run: (action: Promise<ActionResult>) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const conversationId = conversation.id;
  return (
    <>
      {conversation.status === "open" && conversation.assigneeId === null && (
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => run(pickupConversationAction({ conversationId }))}
        >
          {t("pickup")}
        </Button>
      )}
      {conversation.status === "in_progress" && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(setConversationWaitingAction({ conversationId }))}
        >
          {t("waiting")}
        </Button>
      )}
      {conversation.status === "waiting_customer" && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(setConversationInProgressAction({ conversationId }))}
        >
          {t("inProgress")}
        </Button>
      )}
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => run(resolveConversationAction({ conversationId }))}
      >
        {t("resolve")}
      </Button>
    </>
  );
}

const SNOOZE_PRESET_KEY = {
  "1h": "snooze1h",
  tomorrow: "snoozeTomorrow",
  week: "snoozeWeek",
} as const;

function snoozeTarget(preset: keyof typeof SNOOZE_PRESET_KEY): Date {
  const now = new Date();
  if (preset === "1h") return new Date(now.getTime() + 3_600_000);
  if (preset === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  return new Date(now.getTime() + 7 * 86_400_000);
}

/** Defer out of every work view; "Retomar" clears an active snooze early. */
function SnoozeControl({
  conversation,
  pending,
  run,
  t,
}: {
  conversation: ConversationDetailRow;
  pending: boolean;
  run: (action: Promise<ActionResult>) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const format = useFormatter();
  const [preset, setPreset] = useState<keyof typeof SNOOZE_PRESET_KEY>();
  const [mountedAt] = useState(() => Date.now());
  const conversationId = conversation.id;
  const snoozedUntil = conversation.snoozedUntil ? new Date(conversation.snoozedUntil) : null;

  if (snoozedUntil && snoozedUntil.getTime() > mountedAt) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-ink-muted text-sm">
          {t("snoozedUntil", {
            date: format.dateTime(snoozedUntil, { dateStyle: "short", timeStyle: "short" }),
          })}
        </span>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(snoozeConversationAction({ conversationId, until: null }))}
        >
          {t("resume")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        options={(Object.keys(SNOOZE_PRESET_KEY) as (keyof typeof SNOOZE_PRESET_KEY)[]).map(
          (p) => ({ value: p, label: t(SNOOZE_PRESET_KEY[p]) }),
        )}
        value={preset}
        onChange={(v) => setPreset(v as keyof typeof SNOOZE_PRESET_KEY)}
        placeholder={t("snoozePlaceholder")}
        aria-label={t("snooze")}
        disabled={pending}
        className="w-44"
      />
      <Button
        variant="secondary"
        disabled={pending || !preset}
        onClick={() =>
          preset && run(snoozeConversationAction({ conversationId, until: snoozeTarget(preset) }))
        }
      >
        {t("snooze")}
      </Button>
    </div>
  );
}
