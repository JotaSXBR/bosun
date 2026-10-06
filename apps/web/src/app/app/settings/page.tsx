import { hasPermission } from "@crm/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import Link from "next/link";

import { getOrgSettings } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { SettingsForm } from "./settings-form";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireTenantContext();
  const settings = await getOrgSettings(ctx);
  // organization:update is owner/admin only — managers can still reach
  // /app/settings/teams, agents and viewers read everything.
  const canEdit = hasPermission(ctx.role, { organization: ["update"] });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <Link href="/app" className="text-muted-foreground text-sm underline">
          Voltar
        </Link>
      </div>

      <SettingsForm settings={settings} canEdit={canEdit} />

      <Card>
        <CardHeader>
          <CardTitle>Equipes</CardTitle>
          <CardDescription>Setores de atendimento e seus membros.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/settings/teams" className="text-sm underline">
            Gerenciar equipes
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
