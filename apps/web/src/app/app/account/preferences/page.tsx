import { getTranslations } from "next-intl/server";

import { getMyPreferences } from "@/server/account";
import { requireSession } from "@/server/tenant";

import { PreferencesForm } from "./preferences-form";

export const dynamic = "force-dynamic";

export default async function AccountPreferencesPage() {
  const session = await requireSession();
  const [t, prefs] = await Promise.all([
    getTranslations("account.preferences"),
    getMyPreferences(session.user.id),
  ]);
  return (
    <PreferencesForm
      theme={prefs.theme}
      sendSeen={prefs.sendSeen}
      labels={{
        theme: t("theme"),
        themeHint: t("themeHint"),
        dark: t("dark"),
        light: t("light"),
        sendSeen: t("sendSeen"),
        sendSeenHint: t("sendSeenHint"),
      }}
    />
  );
}
