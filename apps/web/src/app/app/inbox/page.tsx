import type { ConversationView } from "@crm/core/messaging";
import { Badge } from "@crm/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import { cn } from "@crm/ui/lib/utils";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { TICKET_STATUS } from "@/lib/ticket-status";
import { listConversations } from "@/server/services";
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
  const conversations = await listConversations(ctx, view);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/app/deals" className="text-muted-foreground text-sm underline">
          {t("funnelLink")}
        </Link>
      </div>

      <nav className="flex gap-1 border-b" aria-label={t("viewsAria")}>
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/app/inbox?view=${v}`}
            className={cn(
              "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors",
              view === v && "border-primary text-foreground",
            )}
            aria-current={view === v ? "page" : undefined}
          >
            {t(`views.${v}`)}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{t(`views.${view}`)}</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(`empty.${view}`)}</p>
          ) : (
            <ul className="divide-y" data-testid="conversation-list">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={`/app/inbox/${conversation.id}`}
                    className="hover:bg-muted/50 -mx-2 block space-y-1 rounded-md px-2 py-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {conversation.contactDisplayName ?? conversation.contactChannelUserId}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          #{conversation.ticketNumber}
                        </span>
                        <Badge variant={TICKET_STATUS[conversation.status]?.variant ?? "outline"}>
                          {ts.has(conversation.status)
                            ? ts(conversation.status)
                            : conversation.status}
                        </Badge>
                      </div>
                      {conversation.lastMessageAt && (
                        <time className="text-muted-foreground text-xs">
                          {format.dateTime(conversation.lastMessageAt, {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </time>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {conversation.lastMessagePreview ? (
                        <p className="text-muted-foreground truncate text-sm">
                          {conversation.lastMessagePreview}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {[conversation.assigneeName, conversation.sectorName]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
