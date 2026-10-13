import { getTranslations } from "next-intl/server";

import { requireSession } from "@/server/tenant";

import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await requireSession();
  const t = await getTranslations("account.profile");
  return (
    <ProfileForm
      name={session.user.name}
      email={session.user.email}
      image={session.user.image ?? null}
      labels={{
        photo: t("photo"),
        photoHint: t("photoHint"),
        upload: t("upload"),
        name: t("name"),
        email: t("email"),
        submit: t("submit"),
        saved: t("saved"),
      }}
    />
  );
}
