import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import Link from "next/link";

import { listConversations } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  open: "aberta",
  resolved: "resolvida",
  archived: "arquivada",
};

export default async function InboxPage() {
  const ctx = await requireTenantContext();
  const conversations = await listConversations(ctx);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <Link href="/app" className="text-muted-foreground text-sm underline">
          Voltar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="divide-y" data-testid="conversation-list">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="space-y-1 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {conversation.contactDisplayName ?? conversation.contactChannelUserId}
                      </span>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {STATUS_LABELS[conversation.status] ?? conversation.status}
                      </span>
                    </div>
                    {conversation.lastMessageAt && (
                      <time className="text-muted-foreground text-xs">
                        {conversation.lastMessageAt.toLocaleString("pt-BR")}
                      </time>
                    )}
                  </div>
                  {conversation.lastMessagePreview && (
                    <p className="text-muted-foreground truncate text-sm">
                      {conversation.lastMessagePreview}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
