import { NotFoundError } from "@crm/core";
import { draftPayloadSchema } from "@crm/core/drafts";
import type { ConversationDetailRow } from "@crm/core/messaging";
import { canInspectMessageHistory } from "@crm/core/messaging";
import type { AgentSuggestionRow } from "@crm/core/suggestions";
import { Badge } from "@crm/design-system/components/badge";
import { Card } from "@crm/design-system/components/card";
import { EmptyState } from "@crm/design-system/templates/empty-state";
import { captureException } from "@crm/observability";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { Composer } from "@/components/composer";
import { DraftCard } from "@/components/draft-card";
import { MessageItem } from "@/components/message-item";
import { NudgeCard } from "@/components/nudge-card";
import { PresenceIndicator } from "@/components/presence-indicator";
import { TicketActions } from "@/components/ticket-actions";
import { TICKET_STATUS } from "@/lib/ticket-status";
import {
  getConversation,
  getLastInboundAt,
  hasLlmCredential,
  listMembers,
  listMessages,
  listSectors,
  listThreadCardsForConversation,
} from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

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

/**
 * Center column of the inbox workbench — ticket header, message thread,
 * ticket actions, AI cards and composer. Self-contained: fetches its own
 * data so the inbox page can mount it for the selected `?c=` id.
 */
export async function ConversationPane({ conversationId }: { conversationId: string }) {
  const t = await getTranslations("inbox");
  const ts = await getTranslations("ticketStatus");
  const format = await getFormatter();
  const ctx = await requireTenantContext();
  let conversation;
  try {
    conversation = await getConversation(ctx, conversationId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return (
        <Card className="min-w-0 flex-1">
          <EmptyState icon="inbox" title={t("notFound")} />
        </Card>
      );
    }
    throw error;
  }
  const [messages, members, sectors] = await Promise.all([
    listMessages(ctx, conversationId),
    listMembers(ctx),
    listSectors(ctx),
  ]);

  const isViewer = ctx.role === "viewer";
  const canWork =
    !isViewer && conversation.status !== "resolved" && conversation.status !== "closed";
  // Drafts only render on a workable thread — a pending card on a
  // resolved ticket would sit disabled forever.
  const showDrafts = canWork && hasPermission(ctx.role, { messaging: ["write"] });
  const [cards, lastInboundAt, hasCredential] = showDrafts
    ? await Promise.all([
        listThreadCardsForConversation(ctx, conversationId).catch((error: unknown) => {
          captureException(error, { action: "listThreadCardsForConversation" });
          return [];
        }),
        getLastInboundAt(ctx, conversationId),
        hasLlmCredential(ctx),
      ])
    : [[] as AgentSuggestionRow[], null, false];

  return (
    <Card bodyClassName="space-y-4" className="min-w-0 flex-1">
      <TicketHeader conversation={conversation} t={t} ts={ts} format={format} />

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

      {showDrafts &&
        cards.map((card) =>
          card.targetType === "nudge" ? (
            <NudgeCard key={card.id} suggestionId={card.id} rationale={card.rationale} />
          ) : (
            <DraftCard
              key={card.id}
              suggestionId={card.id}
              body={draftPayloadSchema.safeParse(card.payload).data?.body ?? ""}
              rationale={card.rationale}
              stale={lastInboundAt !== null && lastInboundAt > card.createdAt}
            />
          ),
        )}

      {!isViewer && (
        <Composer
          conversationId={conversation.id}
          disabled={!canWork}
          draftsEnabled={hasCredential}
        />
      )}
    </Card>
  );
}
