"use client";

import { Tabs } from "@crm/design-system/components/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const SUBPATHS = ["agents", "credentials"] as const;

/** Section nav for /app/settings/ai/* — tabs as links, active from the URL. */
export function AiTabs() {
  const t = useTranslations("settings.ai.tabs");
  const pathname = usePathname();
  const router = useRouter();
  const active = SUBPATHS.find((s) => pathname.includes(`/${s}`)) ?? "agents";
  return (
    <Tabs
      items={SUBPATHS.map((s) => ({ value: s, label: t(s) }))}
      value={active}
      onChange={(value) => router.push(`/app/settings/ai/${value}`)}
    />
  );
}
