"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@crm/ui/components/dropdown-menu";
import { IconButton } from "@crm/ui/components/icon-button";
import { AppTopBar } from "@crm/ui/templates/app-top-bar";
import { CommandPalette, useCommandShortcut } from "@crm/ui/templates/command-palette";
import { UserMenu } from "@crm/ui/templates/user-menu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

const MODULES = [
  { id: "home", href: "/app", icon: "house", key: "home" },
  { id: "inbox", href: "/app/inbox", icon: "inbox", key: "inbox" },
  { id: "deals", href: "/app/deals", icon: "folder-kanban", key: "deals" },
  { id: "integrations", href: "/app/integrations", icon: "plug", key: "integrations" },
  { id: "settings", href: "/app/settings", icon: "settings", key: "settings" },
] as const;

function activeModule(pathname: string): string {
  if (pathname === "/app") return "home";
  return MODULES.find((m) => m.id !== "home" && pathname.startsWith(m.href))?.id ?? "home";
}

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  const openPalette = React.useCallback(() => setPaletteOpen(true), []);
  useCommandShortcut(openPalette);

  const signOut = React.useCallback(async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }, [router]);

  const modules = MODULES.map((m) => ({ id: m.id, label: t(m.key), icon: m.icon, href: m.href }));

  return (
    <>
      <AppTopBar
        modules={modules}
        active={activeModule(pathname)}
        linkComponent={Link}
        actions={
          <>
            <IconButton
              icon="search"
              label={t("search")}
              aria-keyshortcuts="Control+K Meta+K"
              onClick={openPalette}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton icon="bell" label={t("alerts")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-3">
                <p className="text-ink-strong text-sm font-medium">{t("alertsEmpty")}</p>
                <p className="text-ink-muted mt-1 text-xs">{t("alertsEmptyBody")}</p>
              </DropdownMenuContent>
            </DropdownMenu>
            <UserMenu
              name={user.name ?? user.email ?? t("account")}
              email={user.email ?? undefined}
              src={user.image ?? undefined}
              linkComponent={Link}
              label={t("account")}
              items={[
                { icon: "settings", label: t("settings"), href: "/app/settings" },
                { icon: "log-out", label: t("signOut"), onSelect: () => void signOut() },
              ]}
            />
          </>
        }
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder={t("commandPlaceholder")}
        emptyLabel={(q) => t("commandEmpty", { query: q })}
        groups={[
          {
            label: t("modules"),
            items: MODULES.map((m) => ({
              id: m.id,
              icon: m.icon,
              label: t(m.key),
              onSelect: () => router.push(m.href),
            })),
          },
          {
            label: t("account"),
            items: [
              {
                id: "sign-out",
                icon: "log-out",
                label: t("signOut"),
                onSelect: () => void signOut(),
              },
            ],
          },
        ]}
      />
      {children}
    </>
  );
}
