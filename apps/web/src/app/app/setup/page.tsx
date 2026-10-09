import { PageHeader } from "@crm/ui/templates/page-header";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { productConfigured } from "@/server/services";
import { requireSession } from "@/server/tenant";

import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

/**
 * First-run wizard: reachable only by platform_admin while the e-mail group
 * isn't configured. Members land back on /app; once e-mail resolves
 * (DB → env), the admin does too.
 */
export default async function SetupPage() {
  const session = await requireSession();
  const t = await getTranslations("setup");
  if (session.user.role !== "platform_admin") redirect("/app");
  if (await productConfigured("email")) redirect("/app");

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <PageHeader title={t("pageTitle")} />
      <p className="text-ink-muted -mt-4 mb-6 text-sm">{t("pageDescription")}</p>
      <SetupForm />
    </main>
  );
}
