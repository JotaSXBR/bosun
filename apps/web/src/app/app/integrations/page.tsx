import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import { headers } from "next/headers";
import Link from "next/link";

import { listChannelConnections } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { ConnectionActions } from "./connection-actions";
import { CopyButton } from "./copy-button";
import { NewConnectionForm } from "./new-connection-form";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "pendente",
  connected: "conectado",
  connecting: "conectando",
  disconnected: "desconectado",
  error: "erro",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  connected: "bg-emerald-100 text-emerald-800",
  connecting: "bg-amber-100 text-amber-800",
  disconnected: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
};

export default async function IntegrationsPage() {
  const ctx = await requireTenantContext();
  const connections = await listChannelConnections(ctx);
  const canManage = ctx.isPlatformAdmin || ctx.role !== "agent";

  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <Link href="/app" className="text-muted-foreground text-sm underline">
          Voltar
        </Link>
      </div>

      {canManage && <NewConnectionForm />}

      <Card>
        <CardHeader>
          <CardTitle>Conexões de canal</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma conexão configurada.</p>
          ) : (
            <ul className="space-y-4" data-testid="connection-list">
              {connections.map((conn) => {
                const webhookUrl = `${origin}/api/webhooks/channels/${conn.webhookToken}`;
                return (
                  <li key={conn.id} className="space-y-2 border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{conn.name}</span>
                        <span className="text-muted-foreground text-xs uppercase">{conn.kind}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[conn.status] ?? "bg-muted text-muted-foreground"}`}
                          data-testid={`status-${conn.id}`}
                        >
                          {STATUS_LABELS[conn.status] ?? conn.status}
                        </span>
                      </div>
                      {canManage && <ConnectionActions id={conn.id} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-xs">
                        {webhookUrl}
                      </code>
                      <CopyButton value={webhookUrl} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
