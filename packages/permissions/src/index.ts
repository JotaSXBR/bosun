// Authorization model (org roles) — authentication lives in @crm/auth.
// `ac`/`roles` are consumed by the better-auth organization plugin so the same
// matrix governs auth.api permission checks and application-level checks.
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  audit: ["read"],
  integrations: ["read", "manage"],
  messaging: ["read", "write"],
  teams: ["read", "manage"],
  leads: ["read", "write", "manage"],
  billing: ["read"],
  ai: ["read", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  owner: ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    audit: ["read"],
    integrations: ["read", "manage"],
    messaging: ["read", "write"],
    teams: ["read", "manage"],
    leads: ["read", "write", "manage"],
    billing: ["read"],
    ai: ["read", "manage"],
  }),
  admin: ac.newRole({
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    audit: ["read"],
    integrations: ["read", "manage"],
    messaging: ["read", "write"],
    teams: ["read", "manage"],
    leads: ["read", "write", "manage"],
    billing: ["read"],
    ai: ["read", "manage"],
  }),
  manager: ac.newRole({
    invitation: ["create"],
    audit: ["read"],
    integrations: ["read", "manage"],
    messaging: ["read", "write"],
    teams: ["read", "manage"],
    leads: ["read", "write", "manage"],
    ai: ["read", "manage"],
  }),
  agent: ac.newRole({
    integrations: ["read"],
    messaging: ["read", "write"],
    teams: ["read"],
    leads: ["read", "write"],
  }),
  // Read-only member: can look at everything, change nothing, no billing.
  viewer: ac.newRole({
    audit: ["read"],
    integrations: ["read"],
    messaging: ["read"],
    teams: ["read"],
    leads: ["read"],
    ai: ["read"],
  }),
} as const;

export type Statement = typeof statement;
export type Resource = keyof Statement;
export type OrgRole = keyof typeof roles;

export const ORG_ROLES = ["owner", "admin", "manager", "agent", "viewer"] as const;

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

export type PermissionCheck = {
  [K in Resource]?: readonly Statement[K][number][];
};

/** Pure check: does `role` hold ALL of the requested permissions? */
export function hasPermission(role: OrgRole, permissions: PermissionCheck): boolean {
  const roleStatements = roles[role].statements as Partial<Record<Resource, readonly string[]>>;
  return Object.entries(permissions).every(([resource, actions]) => {
    const granted = roleStatements[resource as Resource];
    if (!granted) return false;
    return (actions as readonly string[]).every((action) => granted.includes(action));
  });
}
