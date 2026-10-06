import { NotFoundError } from "@crm/core";
import type { ConversationDetailRow } from "@crm/core/messaging";
import { canInspectMessageHistory } from "@crm/core/messaging";
import { Badge } from "@crm/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Composer } from "@/components/composer";
import { MessageItem } from "@/components/message-item";
import { PresenceIndicator } from "@/components/presence-indicator";
import { TicketActions } from "@/components/ticket-actions";
import { TICKET_STATUS } from "@/lib/ticket-status";
import { getConversation, listMembers, listMessages, listSectors } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function TicketHeader({ conversation }: { conversation: ConversationDetailRow }) {
  const status = TICKET_STATUS[conversation.status];
  return (
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <CardTitle>
          #{conversation.ticketNumber} ·{" "}
          {conversation.contactDisplayName ?? conversation.contactChannelUserId}{" "}
          <PresenceIndicator conversationId={conversation.id} />
        </CardTitle>
        <Badge variant={status?.variant ?? "outline"}>{status?.label ?? conversation.status}</Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        {conversation.ticketSeq}º atendimento deste contato · aberto em{" "}
        {conversation.createdAt.toLocaleString("pt-BR")}
        {conversation.assigneeName && <> · {conversation.assigneeName}</>}
        {conversation.sectorName && <> · {conversation.sectorName}</>}
      </p>
    </CardHeader>
  );
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenantContext();
  const { id } = await params;
  let conversation;
  try {
    conversation = await getConversation(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const [messages, members, sectors] = await Promise.all([
    listMessages(ctx, id),
    listMembers(ctx),
    listSectors(ctx),
  ]);

  const isViewer = ctx.role === "viewer";
  const canWork =
    !isViewer && conversation.status !== "resolved" && conversation.status !== "closed";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <Link href="/app/inbox" className="text-muted-foreground text-sm underline">
          ← Inbox
        </Link>
      </div>

      <Card>
        <TicketHeader conversation={conversation} />

        <CardContent className="space-y-4">
          {conversation.precededById && (
            <Link
              href={`/app/inbox/${conversation.precededById}`}
              className="text-muted-foreground hover:text-foreground block rounded-md border border-dashed px-3 py-2 text-center text-xs"
              data-testid="previous-ticket"
            >
              ↑ Ticket anterior
              {conversation.precededTicketNumber ? ` #${conversation.precededTicketNumber}` : ""} —
              ver histórico
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
        </CardContent>
      </Card>
    </main>
  );
}
