import { listAuditEvents } from "@crm/core/audit";
import { listUserOrganizations } from "@crm/core/organizations";
import { getDb } from "@crm/db";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";

import { SignOutButton } from "@/components/sign-out-button";
import { requireTenantContext } from "@/server/tenant";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const db = getDb();
  const ctx = await requireTenantContext();
  const orgs = await listUserOrganizations(db, ctx.userId);
  const org = orgs.find((o) => o.organizationId === ctx.organizationId);
  const canReadAudit = ctx.isPlatformAdmin || ctx.role !== "agent";
  const events = canReadAudit ? await listAuditEvents(db, ctx, { limit: 10 }) : [];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="org-name">
          {org?.name ?? "Organização"}
        </h1>
        <SignOutButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Usuário:</span> {ctx.userId}
          </p>
          <p>
            <span className="text-muted-foreground">Papel:</span> {ctx.role}
            {ctx.isPlatformAdmin ? " (platform admin)" : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado.</p>
          ) : (
            <ul className="space-y-1 text-sm" data-testid="audit-list">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between gap-4">
                  <span>{event.action}</span>
                  <span className="text-muted-foreground">{event.createdAt.toISOString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
