"use client";

import { Tabs } from "@crm/design-system/components/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const SUBPATHS = ["profile", "security", "preferences", "notifications"] as const;

/** Section nav for /app/account/* — tabs as links, active from the URL. */
export function AccountTabs() {
  const t = useTranslations("account.tabs");
  const pathname = usePathname();
  const router = useRouter();
  const active = SUBPATHS.find((s) => pathname.includes(`/${s}`)) ?? "profile";
  return (
    <Tabs
      items={SUBPATHS.map((s) => ({ value: s, label: t(s) }))}
      value={active}
      onChange={(value) => router.push(`/app/account/${value}`)}
    />
  );
}
