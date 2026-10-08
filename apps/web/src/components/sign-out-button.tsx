"use client";

import { Button } from "@crm/ui/components/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("nav");
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      {t("signOut")}
    </Button>
  );
}
