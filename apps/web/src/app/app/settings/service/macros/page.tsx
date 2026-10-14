import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { listMacros, listPendingMacros } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { MacrosManager } from "./macros-manager";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function MacrosSettingsPage() {
  const t = await getTranslations("settings");
  const ti = await getTranslations("settings.hub.items");
  const ctx = await requireTenantContext();
  if (!hasPermission(ctx.role, { messaging: ["read"] })) notFound();
  const [macros, pending] = await Promise.all([listMacros(ctx), listPendingMacros(ctx)]);

  // Mirrors assertMacroWriter in @crm/core/macros — agent proposes only.
  const canWrite =
    ctx.isPlatformAdmin || ctx.role === "owner" || ctx.role === "admin" || ctx.role === "manager";
  const canReview = hasPermission(ctx.role, { ai: ["manage"] });
  const canPropose = hasPermission(ctx.role, { messaging: ["write"] });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={ti("macros")}
        back={{ href: "/app/settings", label: t("back") }}
        linkComponent={Link}
      />
      <MacrosManager
        macros={macros}
        pending={pending}
        canWrite={canWrite}
        canReview={canReview}
        canPropose={canPropose}
        currentUserId={ctx.userId}
      />
    </main>
  );
}
