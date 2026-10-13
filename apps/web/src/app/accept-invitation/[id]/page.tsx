import { AuthLayout } from "@crm/design-system/templates/auth-layout";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { findInvitation } from "@/server/account";
import { getSession } from "@/server/tenant";

import { AcceptInvitationCard, InvalidInvitation } from "./accept-card";

export const dynamic = "force-dynamic";

/**
 * Public invitation landing — the invitee may not have a session yet, so
 * signed-out visitors are sent to sign-in with ?next back here. The
 * invitation id itself is the capability token.
 */
export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, tl, invitation, session] = await Promise.all([
    getTranslations("acceptInvitation"),
    getTranslations("auth.layout"),
    findInvitation(id),
    getSession(),
  ]);

  const next = `/accept-invitation/${id}`;
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  const expired = invitation?.expiresAt ? invitation.expiresAt < new Date() : false;
  const valid = !!invitation && invitation.status === "pending" && !expired;
  const emailMismatch = !!invitation && valid && invitation.email !== session.user.email;

  return (
    <AuthLayout
      lead={tl("lead")}
      payoff={tl("payoff")}
      nodes={tl.raw("nodes") as [string, string, string, string]}
    >
      {valid && !emailMismatch ? (
        <AcceptInvitationCard
          invitationId={id}
          organizationName={invitation.organizationName}
          labels={{
            title: t("title", { org: invitation.organizationName }),
            description: t("description"),
            accept: t("accept"),
            accepted: t("accepted"),
          }}
        />
      ) : (
        <InvalidInvitation
          title={emailMismatch ? t("wrongEmailTitle") : t("invalidTitle")}
          body={emailMismatch ? t("wrongEmailBody", { email: invitation.email }) : t("invalidBody")}
        />
      )}
    </AuthLayout>
  );
}
