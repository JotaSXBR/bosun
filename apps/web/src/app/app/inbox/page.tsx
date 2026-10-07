import type { ConversationView } from "@crm/core/messaging";
import { Badge } from "@crm/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import { cn } from "@crm/ui/lib/utils";
import Link from "next/link";

import { TICKET_STATUS } from "@/lib/ticket-status";
import { listConversations } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

const VIEWS: { key: ConversationView; label: string }[] = [
  { key: "queue", label: "Fila" },
  { key: "mine", label: "Minhas" },
  { key: "inbox", label: "Todas" },
  { key: "resolved", label: "Resolvidas" },
];

const EMPTY_HINTS: Record<ConversationView, string> = {
  queue: "Nenhum ticket aguardando atendimento.",
  mine: "Você não tem tickets em atendimento.",
  inbox: "Nenhuma conversa ainda.",
  resolved: "Nenhum ticket resolvido ainda.",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const ctx = await requireTenantContext();
  const { view: raw } = await searchParams;
  const view: ConversationView = VIEWS.some((v) => v.key === raw)
    ? (raw as ConversationView)
    : "queue";
  const conversations = await listConversations(ctx, view);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <Link href="/app/deals" className="text-muted-foreground text-sm underline">
          Funil →
        </Link>
      </div>

      <nav className="flex gap-1 border-b" aria-label="Views da inbox">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/app/inbox?view=${v.key}`}
            className={cn(
              "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors",
              view === v.key && "border-primary text-foreground",
            )}
            aria-current={view === v.key ? "page" : undefined}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{VIEWS.find((v) => v.key === view)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{EMPTY_HINTS[view]}</p>
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
                          {TICKET_STATUS[conversation.status]?.label ?? conversation.status}
                        </Badge>
                      </div>
                      {conversation.lastMessageAt && (
                        <time className="text-muted-foreground text-xs">
                          {conversation.lastMessageAt.toLocaleString("pt-BR")}
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
