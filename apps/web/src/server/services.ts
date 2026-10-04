import "server-only";

import type { TenantContext } from "@crm/core";
import type { AuditLogRow, ListAuditEventsInput } from "@crm/core/audit";
import { listAuditEvents } from "@crm/core/audit";
import type { ChannelConnectionRow } from "@crm/core/integrations";
import { listChannelConnectionsForTenant } from "@crm/core/integrations";
import type { ConversationListRow } from "@crm/core/messaging";
import { listTenantConversations } from "@crm/core/messaging";
import type { UserOrganization } from "@crm/core/organizations";
import { listUserOrganizations } from "@crm/core/organizations";
import { getDb } from "@crm/db";

/**
 * Server-side composition helpers: the only place UI code may reach @crm/core
 * services from — they bind the db handle internally so .tsx files never
 * import @crm/db (enforced by no-restricted-imports in eslint.config.js).
 */
export async function listRecentAuditEvents(
  ctx: TenantContext,
  opts?: ListAuditEventsInput,
): Promise<AuditLogRow[]> {
  return listAuditEvents(getDb(), ctx, opts);
}

export async function listMyOrganizations(userId: string): Promise<UserOrganization[]> {
  return listUserOrganizations(getDb(), userId);
}

export async function listChannelConnections(ctx: TenantContext): Promise<ChannelConnectionRow[]> {
  return listChannelConnectionsForTenant(getDb(), ctx);
}

export async function listConversations(ctx: TenantContext): Promise<ConversationListRow[]> {
  return listTenantConversations(getDb(), ctx);
}
