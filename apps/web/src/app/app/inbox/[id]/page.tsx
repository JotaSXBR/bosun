import { NotFoundError } from "@crm/core";
import type { ConversationDetailRow, MessageWithAuthorRow } from "@crm/core/messaging";
import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { Badge } from "@crm/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import { cn } from "@crm/ui/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Composer } from "@/components/composer";
import { TicketActions } from "@/components/ticket-actions";
import { TICKET_STATUS } from "@/lib/ticket-status";
import { getConversation, listMembers, listMessages, listSectors } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function messageText(content: unknown): string {
  const c = content as { type?: string; text?: string; caption?: string };
  return c.text ?? c.caption ?? `[${c.type ?? "mensagem"}]`;
}

function memberName(members: OrgMember[], userId: unknown): string {
  const m = members.find((x) => x.userId === userId);
  return m?.name ?? "—";
}

function sectorName(sectors: TeamWithMembers[], teamId: unknown): string {
  const t = sectors.find((x) => x.id === teamId);
  return t?.name ?? "—";
}

function SystemLine({
  msg,
  members,
  sectors,
}: {
  msg: MessageWithAuthorRow;
  members: OrgMember[];
  sectors: TeamWithMembers[];
}) {
  const meta = msg.metadata as Record<string, unknown>;
  let text = "Evento do sistema";
  if (meta.system === "transfer") {
    const to = meta.toAssigneeId
      ? memberName(members, meta.toAssigneeId)
      : sectorName(sectors, meta.toSectorId);
    const from = meta.fromAssigneeId ? memberName(members, meta.fromAssigneeId) : "a fila";
    text = `Transferido de ${from} para ${to}`;
  }
  return (
    <li
      className="text-muted-foreground py-1 text-center text-xs italic"
      data-testid="system-event"
    >
      — {text} · {msg.createdAt.toLocaleString("pt-BR")} —
    </li>
  );
}

function MessageItem({
  msg,
  members,
  sectors,
}: {
  msg: MessageWithAuthorRow;
  members: OrgMember[];
  sectors: TeamWithMembers[];
}) {
  const meta = msg.metadata as Record<string, unknown>;
  if (meta.system) return <SystemLine msg={msg} members={members} sectors={sectors} />;
  if (msg.private) {
    return (
      <li
        className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2"
        data-testid="internal-note"
      >
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Nota interna · {msg.authorName ?? "—"} · {msg.createdAt.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap">{messageText(msg.content)}</p>
      </li>
    );
  }
  const outbound = msg.direction === "outbound";
  return (
    <li className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          outbound ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{messageText(msg.content)}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            outbound ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {outbound && msg.authorName ? `${msg.authorName} · ` : ""}
          {msg.sentAt?.toLocaleString("pt-BR") ?? msg.createdAt.toLocaleString("pt-BR")}
          {msg.status === "failed" && " · falhou"}
        </p>
      </div>
    </li>
  );
}

function TicketHeader({ conversation }: { conversation: ConversationDetailRow }) {
  const status = TICKET_STATUS[conversation.status];
  return (
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <CardTitle>
          #{conversation.ticketNumber} ·{" "}
          {conversation.contactDisplayName ?? conversation.contactChannelUserId}
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
              <MessageItem key={msg.id} msg={msg} members={members} sectors={sectors} />
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
