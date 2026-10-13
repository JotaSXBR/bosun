import { getTranslations } from "next-intl/server";

import { listMySessions } from "@/server/account";
import { requireSession } from "@/server/tenant";

import { SecurityForm } from "./security-form";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const session = await requireSession();
  const [t, sessions] = await Promise.all([getTranslations("account.security"), listMySessions()]);
  const currentToken = session.session.token;
  return (
    <SecurityForm
      sessions={sessions.map((s) => ({
        token: s.token,
        current: s.token === currentToken,
        createdAt: s.createdAt,
        ipAddress: s.ipAddress ?? null,
        userAgent: s.userAgent ?? null,
      }))}
      labels={{
        password: t("password"),
        currentPassword: t("currentPassword"),
        newPassword: t("newPassword"),
        submit: t("submit"),
        changed: t("changed"),
        sessions: t("sessions"),
        sessionsHint: t("sessionsHint"),
        thisDevice: t("thisDevice"),
        revoke: t("revoke"),
        revoked: t("revoked"),
      }}
    />
  );
}
