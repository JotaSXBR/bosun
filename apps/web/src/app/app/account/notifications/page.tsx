import { getTranslations } from "next-intl/server";

import { getMyPreferences } from "@/server/account";
import { requireSession } from "@/server/tenant";

import { NotificationsForm } from "./notifications-form";

export const dynamic = "force-dynamic";

export default async function AccountNotificationsPage() {
  const session = await requireSession();
  const [t, prefs] = await Promise.all([
    getTranslations("account.notifications"),
    getMyPreferences(session.user.id),
  ]);
  return (
    <NotificationsForm
      toasts={prefs.toasts}
      labels={{
        title: t("toasts"),
        hint: t("toastsHint"),
        drafts: t("drafts"),
        nudges: t("nudges"),
        suggestions: t("suggestions"),
      }}
    />
  );
}
