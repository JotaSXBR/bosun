import type { IconName } from "@crm/design-system/components/icon";
import type { PermissionCheck } from "@crm/permissions";

export interface HubItem {
  /** i18n key inside settings.hub.items — also the page title. */
  key: string;
  href: string;
  icon: IconName;
  /** Same permission the destination page requires — hidden means 404 anyway. */
  permission: PermissionCheck;
}

export interface HubGroup {
  /** i18n key inside settings.hub for the group title. */
  key: string;
  items: HubItem[];
}

// Groups + entries mirror the IA tree (docs/product/ia-navegacao.md §3).
export const HUB_GROUPS: HubGroup[] = [
  {
    key: "organization",
    items: [
      {
        key: "general",
        href: "/app/settings/organization/general",
        icon: "settings",
        permission: { organization: ["update"] },
      },
      {
        key: "members",
        href: "/app/settings/organization/members",
        icon: "users",
        permission: { member: ["create"] },
      },
      {
        key: "billing",
        href: "/app/settings/organization/billing",
        icon: "gauge",
        permission: { billing: ["read"] },
      },
      {
        key: "audit",
        href: "/app/settings/organization/audit",
        icon: "history",
        permission: { audit: ["read"] },
      },
    ],
  },
  {
    key: "service",
    items: [
      {
        key: "teams",
        href: "/app/settings/service/teams",
        icon: "users",
        permission: { teams: ["manage"] },
      },
      {
        key: "hours",
        href: "/app/settings/service/hours",
        icon: "clock",
        permission: { organization: ["update"] },
      },
      {
        key: "rules",
        href: "/app/settings/service/rules",
        icon: "timer",
        permission: { organization: ["update"] },
      },
    ],
  },
  {
    key: "channels",
    items: [
      {
        key: "channels",
        href: "/app/settings/channels",
        icon: "plug",
        permission: { integrations: ["manage"] },
      },
    ],
  },
  {
    key: "sales",
    items: [
      {
        key: "funnels",
        href: "/app/settings/sales/funnels",
        icon: "folder-kanban",
        permission: { leads: ["manage"] },
      },
    ],
  },
  {
    key: "ai",
    items: [
      {
        key: "ai",
        href: "/app/settings/ai",
        icon: "sparkles",
        permission: { ai: ["manage"] },
      },
    ],
  },
];
