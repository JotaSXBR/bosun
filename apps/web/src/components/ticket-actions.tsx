"use client";

import type { ConversationDetailRow } from "@crm/core/messaging";
import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { Button } from "@crm/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  pickupConversationAction,
  reopenTicketAction,
  resolveConversationAction,
  resumeTicketAction,
  setConversationInProgressAction,
  setConversationWaitingAction,
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
  const [target, setTarget] = useState("");

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
          variant="outline"
          disabled={pending}
          onClick={() => run(reopenTicketAction({ conversationId }))}
        >
          {t("reopen")}
        </Button>
      )}

      {isClosed && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(resumeTicketAction({ conversationId }))}
        >
          {t("newService")}
        </Button>
      )}

      {canWork && !ownsTicket && (
        <span className="text-muted-foreground text-sm">
          {t("inServiceBy", { name: conversation.assigneeName ?? "?" })}
        </span>
      )}

      {canWork && ownsTicket && (
        <WorkButtons conversation={conversation} pending={pending} run={run} t={t} />
      )}

      {canWork && (
        <div className="flex items-center gap-2">
          <Select value={target} onValueChange={setTarget} disabled={pending}>
            <SelectTrigger className="w-52" aria-label={t("transferTo")}>
              <SelectValue placeholder={t("transferPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("agents")}</SelectLabel>
                {agents.map((m) => (
                  <SelectItem key={m.userId} value={`user:${m.userId}`}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>{t("sectors")}</SelectLabel>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={`sector:${s.id}`}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={pending || !target} onClick={doTransfer}>
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
          disabled={pending}
          onClick={() => run(pickupConversationAction({ conversationId }))}
        >
          {t("pickup")}
        </Button>
      )}
      {conversation.status === "in_progress" && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(setConversationWaitingAction({ conversationId }))}
        >
          {t("waiting")}
        </Button>
      )}
      {conversation.status === "waiting_customer" && (
        <Button
          variant="outline"
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
