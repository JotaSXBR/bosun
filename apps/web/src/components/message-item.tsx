// Server-rendered message bubble — interactive affordances are the client
// islands in ./message-extras (menu, chips, edit history, view-original).
import type { MessageContent, MessageWithAuthorRow } from "@crm/core/messaging";
import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { cn } from "@crm/ui/lib/utils";
import Image from "next/image";

import { EditedIndicator, MessageMenu, RevokedActions } from "@/components/message-extras";
import { ReactionChips } from "@/components/reaction-chips";

function messageText(content: unknown): string {
  const c = content as { type?: string; text?: string; caption?: string };
  return c.text ?? c.caption ?? `[${c.type ?? "mensagem"}]`;
}

/** WhatsApp-style ticks: ✓ enviada · ✓✓ entregue (cinza) · ✓✓ lida (azul). */
function MessageTicks({ status }: { status: string }) {
  if (status === "read") {
    return (
      <span className="text-info" title="Lida" data-testid="tick-read">
        ✓✓
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span className="opacity-80" title="Entregue">
        ✓✓
      </span>
    );
  }
  if (status === "sent" || status === "queued") {
    return (
      <span className="opacity-80" title="Enviada">
        ✓
      </span>
    );
  }
  return null;
}

/** Quoted message preview rendered above the bubble content. */
function QuoteBlock({
  quoted,
  outbound,
}: {
  quoted: NonNullable<MessageWithAuthorRow["quoted"]>;
  outbound: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-1 rounded-md border-l-4 px-2 py-1 text-xs",
        outbound
          ? "border-primary-foreground/60 bg-primary-foreground/15"
          : "border-muted-foreground/50 bg-background/60",
      )}
      data-testid="quoted-message"
    >
      <p className="font-medium">
        {quoted.direction === "outbound" ? (quoted.authorName ?? "Você") : "Contato"}
      </p>
      <p className="line-clamp-2 italic opacity-80">
        {quoted.revoked ? "Mensagem apagada" : (quoted.preview ?? "…")}
      </p>
    </div>
  );
}

/** Media bubble — the proxy route streams bytes from storage or WAHA. */
function MediaContent({ msg }: { msg: MessageWithAuthorRow }) {
  const content = msg.content as Extract<MessageContent, { type: "media" }>;
  const src = `/api/media/${msg.id}`;
  return (
    <div className="space-y-1">
      {content.mediaKind === "image" && (
        <Image
          src={src}
          alt={content.caption ?? "Imagem recebida"}
          width={0}
          height={0}
          sizes="320px"
          unoptimized
          className="h-auto max-w-full rounded-md"
        />
      )}
      {content.mediaKind === "video" && (
        <video controls src={src} className="max-w-full rounded-md">
          <track kind="captions" label="Sem legendas" />
        </video>
      )}
      {content.mediaKind === "audio" && (
        <audio controls src={src} className="w-64 max-w-full">
          <track kind="captions" label="Sem legendas" />
        </audio>
      )}
      {content.mediaKind === "document" && (
        <a
          href={src}
          className="flex items-center gap-2 underline underline-offset-2"
          data-testid="media-document"
        >
          📄 {content.filename ?? "Documento"}
        </a>
      )}
      {content.caption && <p className="text-sm whitespace-pre-wrap">{content.caption}</p>}
    </div>
  );
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

function PrivateNote({ msg }: { msg: MessageWithAuthorRow }) {
  return (
    <li
      className="border-warning/40 bg-warning/10 rounded-md border px-3 py-2"
      data-testid="internal-note"
    >
      <p className="text-warning text-xs font-medium">
        Nota interna · {msg.authorName ?? "—"} · {msg.createdAt.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{messageText(msg.content)}</p>
    </li>
  );
}

function BubbleBody({ msg, canInspect }: { msg: MessageWithAuthorRow; canInspect: boolean }) {
  const content = msg.content as MessageContent;
  if (msg.revokedAt !== null) {
    return (
      <p className="text-sm italic opacity-70" data-testid="revoked-placeholder">
        🚫 Mensagem apagada
        {canInspect && <RevokedActions conversationId={msg.conversationId} messageId={msg.id} />}
      </p>
    );
  }
  if (content.type === "media") return <MediaContent msg={msg} />;
  return <p className="text-sm whitespace-pre-wrap">{messageText(content)}</p>;
}

function BubbleMeta({
  msg,
  outbound,
  isChannelMessage,
  canInspect,
  menu,
}: {
  msg: MessageWithAuthorRow;
  outbound: boolean;
  isChannelMessage: boolean;
  canInspect: boolean;
  menu: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-1 flex items-center justify-end gap-1 text-xs",
        outbound ? "text-primary-foreground/70" : "text-muted-foreground",
      )}
    >
      {outbound && msg.authorName ? `${msg.authorName} · ` : ""}
      {msg.sentAt?.toLocaleString("pt-BR") ?? msg.createdAt.toLocaleString("pt-BR")}
      {msg.editedAt && (
        <>
          {" · "}
          <EditedIndicator
            conversationId={msg.conversationId}
            messageId={msg.id}
            canInspect={canInspect}
          />
        </>
      )}
      {msg.status === "failed" && " · falhou"}
      {outbound && isChannelMessage && <MessageTicks status={msg.status} />}
      {menu}
    </p>
  );
}

/** Per-message affordances — the ~15min edit window is enforced server-side. */
function messagePermissions(
  msg: MessageWithAuthorRow,
  content: MessageContent,
  currentUserId: string,
  canInteract: boolean,
) {
  const isChannelMessage = msg.externalId !== null;
  const available = canInteract && isChannelMessage && msg.revokedAt === null;
  const ownOutbound = available && msg.direction === "outbound" && msg.authorId === currentUserId;
  return {
    isChannelMessage,
    canReact: available,
    canEdit: ownOutbound && content.type === "text",
    canDelete: ownOutbound,
    replyTarget:
      available && msg.externalId
        ? { externalId: msg.externalId, preview: messageText(content) }
        : undefined,
  };
}

export function MessageItem({
  msg,
  members,
  sectors,
  currentUserId,
  canInspect,
  canInteract,
}: {
  msg: MessageWithAuthorRow;
  members: OrgMember[];
  sectors: TeamWithMembers[];
  currentUserId: string;
  canInspect: boolean;
  canInteract: boolean;
}) {
  const meta = msg.metadata as Record<string, unknown>;
  if (meta.system) return <SystemLine msg={msg} members={members} sectors={sectors} />;
  if (msg.private) return <PrivateNote msg={msg} />;

  const outbound = msg.direction === "outbound";
  const content = msg.content as MessageContent;
  const { isChannelMessage, canReact, canEdit, canDelete, replyTarget } = messagePermissions(
    msg,
    content,
    currentUserId,
    canInteract,
  );

  return (
    <li className={cn("group flex", outbound ? "justify-end" : "justify-start")}>
      <div className="max-w-4/5">
        <div
          className={cn(
            "relative rounded-lg px-3 py-2",
            outbound ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {msg.quoted && <QuoteBlock quoted={msg.quoted} outbound={outbound} />}
          <BubbleBody msg={msg} canInspect={canInspect} />
          <BubbleMeta
            msg={msg}
            outbound={outbound}
            isChannelMessage={isChannelMessage}
            canInspect={canInspect}
            menu={
              <MessageMenu
                conversationId={msg.conversationId}
                messageId={msg.id}
                currentText={messageText(content)}
                canReact={canReact}
                canEdit={canEdit}
                canDelete={canDelete}
                replyTarget={replyTarget}
              />
            }
          />
        </div>
        <ReactionChips
          conversationId={msg.conversationId}
          messageId={msg.id}
          reactions={msg.reactions}
          currentUserId={currentUserId}
          interactive={canInteract}
        />
      </div>
    </li>
  );
}
