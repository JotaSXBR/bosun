"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@crm/design-system/components/dropdown-menu";
import { Icon } from "@crm/design-system/components/icon";
import { IconButton } from "@crm/design-system/components/icon-button";
import type { ModuleNavItem } from "@crm/design-system/components/module-nav";
import { AppShell as DsAppShell } from "@crm/design-system/templates/app-shell";
import { AppTopBar } from "@crm/design-system/templates/app-top-bar";
import { CommandPalette, useCommandShortcut } from "@crm/design-system/templates/command-palette";
import { UserMenu, type UserMenuItem } from "@crm/design-system/templates/user-menu";
import { hasPermission, type OrgRole } from "@crm/permissions";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

import {
  activeModule,
  AI_MODULE,
  MANAGEMENT,
  menuItems,
  type ModuleDef,
  MODULES,
  type OrgRef,
  paletteGroups,
  type ShellAlert,
} from "./app-shell-menu";

interface ShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AppShellProps {
  user: ShellUser;
  /** Active-org role — `null`/absent outside an org context (e.g. /app/setup). */
  role?: OrgRole | null;
  isPlatformAdmin?: boolean;
  currentOrganizationId?: string | null;
  organizations?: OrgRef[];
  /** Bell items — derived server-side; absent/[] renders the empty state. */
  alerts?: ShellAlert[];
  children: React.ReactNode;
}

/** Modules + visibility flags derived from the org role. */
function useShellNav(role?: OrgRole | null) {
  const t = useTranslations("nav");
  const canAi = role ? hasPermission(role, { ai: ["read"] }) : false;
  const canManage = role ? MANAGEMENT.some((p) => hasPermission(role, p)) : false;
  const moduleDefs: readonly ModuleDef[] = canAi ? [...MODULES, AI_MODULE] : MODULES;
  const navModules: ModuleNavItem[] = moduleDefs.map((m) => ({
    id: m.id,
    label: t(m.key),
    icon: m.icon,
    href: m.href,
  }));
  return { canAi, canManage, moduleDefs, navModules };
}

function useShellActions() {
  const router = useRouter();
  const signOut = React.useCallback(() => {
    void authClient.signOut().then(() => {
      router.push("/sign-in");
      router.refresh();
    });
  }, [router]);
  const switchOrg = React.useCallback(
    (organizationId: string) => {
      void authClient.organization.setActive({ organizationId }).then(() => {
        router.push("/app");
        router.refresh();
      });
    },
    [router],
  );
  return { signOut, switchOrg };
}

function AlertsMenu({ alerts }: { alerts: ShellAlert[] }) {
  const t = useTranslations("nav");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton icon="bell" label={t("alerts")} dot={alerts.length > 0} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        {alerts.length === 0 ? (
          <>
            <p className="text-ink-strong text-sm font-medium">{t("alertsEmpty")}</p>
            <p className="text-ink-muted mt-1 text-xs">{t("alertsEmptyBody")}</p>
          </>
        ) : (
          <ul className="space-y-0.5">
            {alerts.map((alert) => (
              <li key={alert.key}>
                <DropdownMenuItem asChild>
                  <Link href={alert.href}>
                    <Icon name={alert.icon} size={16} />
                    <span className="min-w-0 truncate">{alert.label}</span>
                  </Link>
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopActions({
  user,
  canManage,
  items,
  onSearch,
  alerts,
}: {
  user: ShellUser;
  canManage: boolean;
  items: UserMenuItem[];
  onSearch: () => void;
  alerts: ShellAlert[];
}) {
  const t = useTranslations("nav");
  return (
    <>
      <IconButton
        icon="search"
        label={t("search")}
        aria-keyshortcuts="Control+K Meta+K"
        onClick={onSearch}
      />
      <AlertsMenu alerts={alerts} />
      {canManage && (
        <IconButton asChild label={t("settings")}>
          <Link href="/app/settings">
            <Icon name="settings" size={18} />
          </Link>
        </IconButton>
      )}
      <UserMenu
        name={user.name ?? user.email ?? t("account")}
        email={user.email ?? undefined}
        src={user.image ?? undefined}
        linkComponent={Link}
        label={t("account")}
        items={items}
      />
    </>
  );
}

function ShellTopBar({
  navModules,
  pathname,
  user,
  canManage,
  items,
  onSearch,
  alerts,
}: {
  navModules: ModuleNavItem[];
  pathname: string;
  user: ShellUser;
  canManage: boolean;
  items: UserMenuItem[];
  onSearch: () => void;
  alerts: ShellAlert[];
}) {
  return (
    <AppTopBar
      modules={navModules}
      active={activeModule(pathname)}
      linkComponent={Link}
      actions={
        <TopActions
          user={user}
          canManage={canManage}
          items={items}
          onSearch={onSearch}
          alerts={alerts}
        />
      }
    />
  );
}

function Palette({
  open,
  onOpenChange,
  moduleDefs,
  role,
  signOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleDefs: readonly ModuleDef[];
  role?: OrgRole | null;
  signOut: () => void;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const go = React.useCallback((href: string) => () => router.push(href), [router]);
  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      placeholder={t("commandPlaceholder")}
      emptyLabel={(q) => t("commandEmpty", { query: q })}
      groups={paletteGroups({ t, go, moduleDefs, role, signOut })}
    />
  );
}

export function AppShell({
  user,
  role,
  isPlatformAdmin = false,
  currentOrganizationId,
  organizations = [],
  alerts = [],
  children,
}: AppShellProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const { signOut, switchOrg } = useShellActions();
  const { canManage, moduleDefs, navModules } = useShellNav(role);
  useCommandShortcut(React.useCallback(() => setPaletteOpen(true), []));

  return (
    <DsAppShell
      topBar={
        <ShellTopBar
          navModules={navModules}
          pathname={pathname}
          user={user}
          canManage={canManage}
          items={menuItems({
            t,
            organizations,
            currentOrganizationId,
            isPlatformAdmin,
            switchOrg,
            signOut,
          })}
          onSearch={() => setPaletteOpen(true)}
          alerts={alerts}
        />
      }
    >
      <Palette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        moduleDefs={moduleDefs}
        role={role}
        signOut={signOut}
      />
      {children}
    </DsAppShell>
  );
}
