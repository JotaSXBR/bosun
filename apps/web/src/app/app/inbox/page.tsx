import type { ConversationView } from "@crm/core/messaging";
import { Badge } from "@crm/design-system/components/badge";
import { Card } from "@crm/design-system/components/card";
import { cn } from "@crm/design-system/lib/utils";
import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { NewConversationButton } from "@/components/new-conversation-button";
import { TICKET_STATUS } from "@/lib/ticket-status";
import { listConversations, listWahaConnections } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

const VIEWS: ConversationView[] = ["queue", "mine", "inbox", "resolved"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const t = await getTranslations("inbox");
  const ts = await getTranslations("ticketStatus");
  const format = await getFormatter();
  const ctx = await requireTenantContext();
  const { view: raw } = await searchParams;
  const view: ConversationView = VIEWS.some((v) => v === raw) ? (raw as ConversationView) : "queue";
  const canWrite = hasPermission(ctx.role, { messaging: ["write"] });
  const [conversations, connections] = await Promise.all([
    listConversations(ctx, view),
    listWahaConnections(ctx),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={canWrite ? <NewConversationButton connections={connections} /> : undefined}
      />

      <nav className="flex gap-1 border-b" aria-label={t("viewsAria")}>
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/app/inbox?view=${v}`}
            className={cn(
              "text-ink-muted hover:text-ink -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors",
              view === v && "border-line-accent text-ink",
            )}
            aria-current={view === v ? "page" : undefined}
          >
            {t(`views.${v}`)}
          </Link>
        ))}
      </nav>

      {conversations.length === 0 ? (
        <EmptyState icon="inbox" title={t(`empty.${view}`)} />
      ) : (
        <Card title={t(`views.${view}`)}>
          <ul className="divide-y" data-testid="conversation-list">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/app/inbox/${conversation.id}`}
                  className="hover:bg-raised/50 -mx-2 block space-y-1 rounded-md px-2 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {conversation.contactDisplayName ?? conversation.contactChannelUserId}
                      </span>
                      <span className="text-ink-muted text-xs">#{conversation.ticketNumber}</span>
                      <Badge tone={TICKET_STATUS[conversation.status]?.tone ?? "neutral"}>
                        {ts.has(conversation.status)
                          ? ts(conversation.status)
                          : conversation.status}
                      </Badge>
                    </div>
                    {conversation.lastMessageAt && (
                      <time className="text-ink-muted text-xs">
                        {format.dateTime(conversation.lastMessageAt, {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </time>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    {conversation.lastMessagePreview ? (
                      <p className="text-ink-muted truncate text-sm">
                        {conversation.lastMessagePreview}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-ink-muted shrink-0 text-xs">
                      {[conversation.assigneeName, conversation.sectorName]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
