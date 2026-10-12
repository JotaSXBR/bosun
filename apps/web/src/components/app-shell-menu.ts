import type { CommandGroup, CommandItem } from "@crm/design-system/templates/command-palette";
import type { UserMenuItem } from "@crm/design-system/templates/user-menu";
import type { PermissionCheck } from "@crm/permissions";
import type { useTranslations } from "next-intl";

export type NavT = ReturnType<typeof useTranslations>;
export type Go = (href: string) => () => void;

export interface OrgRef {
  organizationId: string;
  name: string;
}

export const MODULES = [
  { id: "home", href: "/app", icon: "house", key: "home" },
  { id: "inbox", href: "/app/inbox", icon: "inbox", key: "inbox" },
  { id: "contacts", href: "/app/contacts", icon: "users", key: "contacts" },
  { id: "deals", href: "/app/deals", icon: "folder-kanban", key: "deals" },
] as const;

export const AI_MODULE = { id: "ai", href: "/app/ai", icon: "sparkles", key: "ai" } as const;
export type ModuleDef = (typeof MODULES)[number] | typeof AI_MODULE;

// Any org-management permission unlocks the settings gear (spec §7.6).
export const MANAGEMENT: PermissionCheck[] = [
  { organization: ["update"] },
  { teams: ["manage"] },
  { integrations: ["manage"] },
  { leads: ["manage"] },
  { ai: ["manage"] },
];

// Settings-hub entries point at current routes; dedicated routes arrive in Slice 3.
const SETTINGS_DESTINATIONS = [
  { id: "settings-org", icon: "settings", key: "settingsOrg", href: "/app/settings" },
  { id: "settings-service", icon: "inbox", key: "settingsService", href: "/app/settings/teams" },
  { id: "settings-channels", icon: "plug", key: "settingsChannels", href: "/app/integrations" },
  { id: "settings-sales", icon: "folder-kanban", key: "settingsSales", href: "/app/settings" },
  { id: "settings-ai", icon: "sparkles", key: "settingsAi", href: "/app/settings/ai" },
] as const;

export function activeModule(pathname: string): string | undefined {
  if (pathname === "/app") return "home";
  return [...MODULES, AI_MODULE].find((m) => m.id !== "home" && pathname.startsWith(m.href))?.id;
}

export function settingsItems(t: NavT, go: Go, canAi: boolean): CommandItem[] {
  return SETTINGS_DESTINATIONS.filter((d) => d.id !== "settings-ai" || canAi).map((d) => ({
    id: d.id,
    icon: d.icon,
    label: t(d.key),
    onSelect: go(d.href),
  }));
}

export function paletteGroups({
  t,
  go,
  moduleDefs,
  canManage,
  canAi,
  signOut,
}: {
  t: NavT;
  go: Go;
  moduleDefs: readonly ModuleDef[];
  canManage: boolean;
  canAi: boolean;
  signOut: () => void;
}): CommandGroup[] {
  const groups: CommandGroup[] = [
    {
      label: t("modules"),
      items: moduleDefs.map((m) => ({
        id: m.id,
        icon: m.icon,
        label: t(m.key),
        onSelect: go(m.href),
      })),
    },
    {
      label: t("account"),
      items: [
        { id: "my-account", icon: "user", label: t("myAccount"), onSelect: go("/app/account") },
      ],
    },
    {
      label: t("actions"),
      items: [{ id: "sign-out", icon: "log-out", label: t("signOut"), onSelect: signOut }],
    },
  ];
  if (canManage) {
    groups.splice(1, 0, { label: t("settings"), items: settingsItems(t, go, canAi) });
  }
  return groups;
}

export function menuItems({
  t,
  organizations,
  currentOrganizationId,
  isPlatformAdmin,
  switchOrg,
  signOut,
}: {
  t: NavT;
  organizations: OrgRef[];
  currentOrganizationId?: string | null;
  isPlatformAdmin: boolean;
  switchOrg: (organizationId: string) => void;
  signOut: () => void;
}): UserMenuItem[] {
  const otherOrgs = organizations.filter((o) => o.organizationId !== currentOrganizationId);
  return [
    { icon: "user", label: t("myAccount"), href: "/app/account" },
    ...otherOrgs.map((o) => ({
      icon: "layers" as const,
      label: t("switchOrg", { org: o.name }),
      onSelect: () => switchOrg(o.organizationId),
    })),
    ...(isPlatformAdmin
      ? [{ icon: "shield-check" as const, label: t("platform"), href: "/app/platform" }]
      : []),
    { icon: "log-out", label: t("signOut"), onSelect: signOut },
  ];
}
