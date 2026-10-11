"use client";

import type { ConversationDetailRow } from "@crm/core/messaging";
import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { Button } from "@crm/design-system/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@crm/design-system/components/dropdown-menu";
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
type T = ReturnType<typeof useTranslations>;

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

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4" data-testid="ticket-actions">
      {isResolved && (
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => run(reopenTicketAction({ conversationId }))}
        >
          {t("reopen")}
        </Button>
      )}

      {isClosed && (
        <Button
          variant="primary"
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

      {canWork && ownsTicket && !isResolved && !isClosed && (
        <WorkActions conversation={conversation} pending={pending} run={run} t={t} />
      )}

      {canWork && (
        <MoreActions
          conversation={conversation}
          agents={agents}
          sectors={sectors}
          pending={pending}
          run={run}
          t={t}
        />
      )}
    </div>
  );
}

/** Primary contextual action + uniform secondary status toggle. */
function WorkActions({
  conversation,
  pending,
  run,
  t,
}: {
  conversation: ConversationDetailRow;
  pending: boolean;
  run: (action: Promise<ActionResult>) => void;
  t: T;
}) {
  const conversationId = conversation.id;
  const unassigned = conversation.assigneeId === null;
  return (
    <>
      {conversation.status === "open" && unassigned ? (
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => run(pickupConversationAction({ conversationId }))}
        >
          {t("pickup")}
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={pending}
          onClick={() => run(resolveConversationAction({ conversationId }))}
        >
          {t("resolve")}
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

/** Less-frequent actions live under one ghost trigger — never competes with
 * the primary. */
function MoreActions({
  conversation,
  agents,
  sectors,
  pending,
  run,
  t,
}: {
  conversation: ConversationDetailRow;
  agents: OrgMember[];
  sectors: TeamWithMembers[];
  pending: boolean;
  run: (action: Promise<ActionResult>) => void;
  t: T;
}) {
  const format = useFormatter();
  const [mountedAt] = useState(() => Date.now());
  const conversationId = conversation.id;
  const snoozedUntil = conversation.snoozedUntil ? new Date(conversation.snoozedUntil) : null;
  const snoozed = snoozedUntil !== null && snoozedUntil.getTime() > mountedAt;

  const transfer = (target: string) => {
    const [kind, id] = target.split(":");
    run(
      transferConversationAction(
        kind === "user" ? { conversationId, assigneeId: id! } : { conversationId, sectorId: id! },
      ),
    );
  };

  return (
    <>
      {snoozed && (
        <span className="text-ink-muted text-sm">
          {t("snoozedUntil", {
            date: format.dateTime(snoozedUntil, { dateStyle: "short", timeStyle: "short" }),
          })}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" iconRight="chevron-down" disabled={pending}>
            {t("moreActions")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {snoozed && (
            <>
              <DropdownMenuItem
                onSelect={() => run(snoozeConversationAction({ conversationId, until: null }))}
              >
                {t("resume")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t("snooze")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(Object.keys(SNOOZE_PRESET_KEY) as (keyof typeof SNOOZE_PRESET_KEY)[]).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onSelect={() =>
                    run(snoozeConversationAction({ conversationId, until: snoozeTarget(p) }))
                  }
                >
                  {t(SNOOZE_PRESET_KEY[p])}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t("transferTo")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>{t("agents")}</DropdownMenuLabel>
              {agents.map((m) => (
                <DropdownMenuItem key={m.userId} onSelect={() => transfer(`user:${m.userId}`)}>
                  {m.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuLabel>{t("sectors")}</DropdownMenuLabel>
              {sectors.map((s) => (
                <DropdownMenuItem key={s.id} onSelect={() => transfer(`sector:${s.id}`)}>
                  {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
