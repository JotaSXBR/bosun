import { NotFoundError } from "@crm/core";
import type { ConversationDetailRow } from "@crm/core/messaging";
import { canInspectMessageHistory } from "@crm/core/messaging";
import { Badge } from "@crm/design-system/components/badge";
import { Card } from "@crm/design-system/components/card";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { Composer } from "@/components/composer";
import { ConversationLeadPanel } from "@/components/conversation-lead-panel";
import { MessageItem } from "@/components/message-item";
import { PresenceIndicator } from "@/components/presence-indicator";
import { TicketActions } from "@/components/ticket-actions";
import { TICKET_STATUS } from "@/lib/ticket-status";
import {
  getConversation,
  getConversationDeal,
  getConversationLabels,
  listFunnelsWithStages,
  listMembers,
  listMessages,
  listOrgLabels,
  listSectors,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function TicketHeader({
  conversation,
  t,
  ts,
  format,
}: {
  conversation: ConversationDetailRow;
  t: Awaited<ReturnType<typeof getTranslations>>;
  ts: Awaited<ReturnType<typeof getTranslations>>;
  format: Awaited<ReturnType<typeof getFormatter>>;
}) {
  const status = TICKET_STATUS[conversation.status];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="font-display tracking-card text-ink-strong text-lg font-medium">
          #{conversation.ticketNumber} ·{" "}
          {conversation.contactDisplayName ?? conversation.contactChannelUserId}{" "}
          <PresenceIndicator conversationId={conversation.id} />
        </div>
        <Badge tone={status?.tone ?? "neutral"}>
          {ts.has(conversation.status) ? ts(conversation.status) : conversation.status}
        </Badge>
      </div>
      <p className="text-ink-muted text-sm">
        {t("ticketSeq", {
          seq: conversation.ticketSeq,
          date: format.dateTime(conversation.createdAt, {
            dateStyle: "short",
            timeStyle: "medium",
          }),
        })}
        {conversation.assigneeName && <> · {conversation.assigneeName}</>}
        {conversation.sectorName && <> · {conversation.sectorName}</>}
      </p>
    </div>
  );
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("inbox");
  const ts = await getTranslations("ticketStatus");
  const format = await getFormatter();
  const ctx = await requireTenantContext();
  const { id } = await params;
  let conversation;
  try {
    conversation = await getConversation(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const [messages, members, sectors, deal, funnels, labels, conversationLabels] = await Promise.all(
    [
      listMessages(ctx, id),
      listMembers(ctx),
      listSectors(ctx),
      getConversationDeal(ctx, id),
      listFunnelsWithStages(ctx),
      listOrgLabels(ctx),
      getConversationLabels(ctx, id),
    ],
  );

  const isViewer = ctx.role === "viewer";
  const canWriteLeads = ctx.role !== "viewer";
  const canManageLeads = hasPermission(ctx.role, { leads: ["manage"] });
  const canWork =
    !isViewer && conversation.status !== "resolved" && conversation.status !== "closed";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <Link href="/app/inbox" className="text-ink-muted text-sm underline">
          {t("backToList")}
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card bodyClassName="space-y-4" className="min-w-0 flex-1">
          <TicketHeader conversation={conversation} t={t} ts={ts} format={format} />

          <>
            {conversation.precededById && (
              <Link
                href={`/app/inbox/${conversation.precededById}`}
                className="text-ink-muted hover:text-ink block rounded-md border border-dashed px-3 py-2 text-center text-xs"
                data-testid="previous-ticket"
              >
                {t("previousTicket", {
                  number: conversation.precededTicketNumber
                    ? ` #${conversation.precededTicketNumber}`
                    : "",
                })}
              </Link>
            )}

            <ul className="space-y-2" data-testid="message-thread">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  members={members}
                  sectors={sectors}
                  currentUserId={ctx.userId}
                  canInspect={canInspectMessageHistory(ctx)}
                  canInteract={canWork}
                />
              ))}
            </ul>

            <TicketActions
              conversation={conversation}
              userId={ctx.userId}
              members={members}
              sectors={sectors}
              canWork={canWork}
              isResolved={conversation.status === "resolved"}
              isClosed={conversation.status === "closed"}
              isViewer={isViewer}
            />

            {!isViewer && <Composer conversationId={conversation.id} disabled={!canWork} />}
          </>
        </Card>

        <ConversationLeadPanel
          conversationId={conversation.id}
          contactName={conversation.contactDisplayName ?? conversation.contactChannelUserId}
          deal={deal}
          funnels={funnels}
          allLabels={labels}
          conversationLabels={conversationLabels}
          canWrite={canWriteLeads}
          canManage={canManageLeads}
        />
      </div>
    </main>
  );
}
