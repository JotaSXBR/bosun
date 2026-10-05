import "server-only";

import type { TenantContext } from "@crm/core";
import type { AuditLogRow, ListAuditEventsInput } from "@crm/core/audit";
import { listAuditEvents } from "@crm/core/audit";
import type { ChannelConnectionRow } from "@crm/core/integrations";
import { listChannelConnectionsForTenant } from "@crm/core/integrations";
import type {
  ConversationDetailRow,
  ConversationListRow,
  ConversationView,
  MessageWithAuthorRow,
} from "@crm/core/messaging";
import {
  getConversationDetail,
  listConversationMessages,
  listTenantConversations,
} from "@crm/core/messaging";
import type { OrgMember, UserOrganization } from "@crm/core/organizations";
import { listOrgMembers, listUserOrganizations } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { listTeams } from "@crm/core/teams";
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

export async function listConversations(
  ctx: TenantContext,
  view?: ConversationView,
): Promise<ConversationListRow[]> {
  return listTenantConversations(getDb(), ctx, { view: view ?? "inbox" });
}

export async function getConversation(
  ctx: TenantContext,
  id: string,
): Promise<ConversationDetailRow> {
  return getConversationDetail(getDb(), ctx, { conversationId: id });
}

export async function listMessages(
  ctx: TenantContext,
  conversationId: string,
): Promise<MessageWithAuthorRow[]> {
  return listConversationMessages(getDb(), ctx, { conversationId });
}

export async function listMembers(ctx: TenantContext): Promise<OrgMember[]> {
  return listOrgMembers(getDb(), ctx);
}

export async function listSectors(ctx: TenantContext): Promise<TeamWithMembers[]> {
  return listTeams(getDb(), ctx);
}
