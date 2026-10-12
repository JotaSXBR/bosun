"use client";

import { Tabs } from "@crm/design-system/components/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const SUBPATHS = ["reviews", "knowledge", "memory"] as const;

/** Section nav for the Inteligência module — tabs as links, active from the URL. */
export function AiModuleTabs() {
  const t = useTranslations("ai.tabs");
  const pathname = usePathname();
  const router = useRouter();
  const active = SUBPATHS.find((s) => pathname.includes(`/${s}`)) ?? "reviews";
  return (
    <Tabs
      items={SUBPATHS.map((s) => ({ value: s, label: t(s) }))}
      value={active}
      onChange={(value) => router.push(`/app/ai/${value}`)}
    />
  );
}
