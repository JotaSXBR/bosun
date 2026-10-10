import "server-only";

import type { TenantContext } from "@crm/core";
import type { AgentRow } from "@crm/core/agents";
import { listAgents } from "@crm/core/agents";
import type { LlmCredentialPublic } from "@crm/core/ai";
import { listLlmCredentials } from "@crm/core/ai";
import type { AuditLogRow, ListAuditEventsInput } from "@crm/core/audit";
import { listAuditEvents } from "@crm/core/audit";
import type { MemoryEntryRow } from "@crm/core/brain";
import { listBrainEntries, listStaleBrainEntries } from "@crm/core/brain";
import type { ContactListRow } from "@crm/core/contacts";
import { listOrgContacts } from "@crm/core/contacts";
import { listDrafts } from "@crm/core/drafts";
import type { ChannelConnectionRow } from "@crm/core/integrations";
import { listChannelConnectionsForTenant } from "@crm/core/integrations";
import type { KnowledgeEntryRow } from "@crm/core/knowledge";
import { listKnowledgeEntries } from "@crm/core/knowledge";
import type { BoardData, DealRow, FunnelRow, LabelRow, StageRow } from "@crm/core/leads";
import {
  getBoard,
  getDealForConversation,
  listConversationLabels,
  listFunnels,
  listLabels,
  listStages,
  searchContacts,
} from "@crm/core/leads";
import type {
  ConversationDetailRow,
  ConversationListRow,
  ConversationView,
  MessageWithAuthorRow,
} from "@crm/core/messaging";
import {
  getConversationDetail,
  getConversationLastInboundAt,
  listConversationMessages,
  listTenantConversations,
} from "@crm/core/messaging";
import type { OrganizationSettingsRow, OrgMember, UserOrganization } from "@crm/core/organizations";
import {
  getOrganizationSettings,
  listOrgMembers,
  listUserOrganizations,
} from "@crm/core/organizations";
import type { PlatformSettingSummary } from "@crm/core/platform";
import { isProductConfigured, listPlatformSettingSummaries } from "@crm/core/platform";
import type { AgentSuggestionRow } from "@crm/core/suggestions";
import { listAgentSuggestions } from "@crm/core/suggestions";
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

export async function getOrgSettings(ctx: TenantContext): Promise<OrganizationSettingsRow> {
  return getOrganizationSettings(getDb(), ctx);
}

/** Platform-admin view of product settings — secrets redacted to flags. */
export async function getPlatformSettings(ctx: TenantContext): Promise<PlatformSettingSummary[]> {
  return listPlatformSettingSummaries(getDb(), ctx);
}

/**
 * Setup-wizard gate helper: returns only a boolean ("is the group ready?"),
 * no data — callers still do their own auth gate (the setup page requires a
 * session + platform_admin role). Exists because app routes can't import
 * @crm/db directly (eslint boundary) — all DB access goes through src/server.
 */
export async function productConfigured(group: "email" | "billing" | "meta" | "ai") {
  return isProductConfigured(getDb(), group);
}

// ---------- leads / funil ----------

export async function listOrgFunnels(ctx: TenantContext): Promise<FunnelRow[]> {
  return listFunnels(getDb(), ctx);
}

export interface FunnelWithStages {
  funnel: FunnelRow;
  stages: StageRow[];
}

/** Funnels + their stages — powers the "Virar lead" dialog's stage picker. */
export async function listFunnelsWithStages(ctx: TenantContext): Promise<FunnelWithStages[]> {
  const funnels = await listFunnels(getDb(), ctx);
  const stages = await Promise.all(funnels.map((funnel) => listStages(getDb(), ctx, funnel.id)));
  return funnels.map((funnel, index) => ({ funnel, stages: stages[index] ?? [] }));
}

export async function getFunnelBoard(ctx: TenantContext, funnelId: string): Promise<BoardData> {
  return getBoard(getDb(), ctx, funnelId);
}

export async function listOrgLabels(ctx: TenantContext): Promise<LabelRow[]> {
  return listLabels(getDb(), ctx);
}

export type ConversationDeal = Awaited<ReturnType<typeof getDealForConversation>>;

export async function getConversationDeal(
  ctx: TenantContext,
  conversationId: string,
): Promise<ConversationDeal> {
  return getDealForConversation(getDb(), ctx, conversationId);
}

export async function getConversationLabels(
  ctx: TenantContext,
  conversationId: string,
): Promise<LabelRow[]> {
  return listConversationLabels(getDb(), ctx, conversationId);
}

export type ContactPickRow = Awaited<ReturnType<typeof searchContacts>>[number];

export async function searchOrgContacts(
  ctx: TenantContext,
  query?: string,
): Promise<ContactPickRow[]> {
  return searchContacts(getDb(), ctx, query);
}

export type { ContactListRow };

export async function listContactsPage(
  ctx: TenantContext,
  query?: string,
): Promise<ContactListRow[]> {
  return listOrgContacts(getDb(), ctx, { query });
}

export type WahaConnectionPick = Pick<ChannelConnectionRow, "id" | "name">;

/** WAHA connections able to start outbound conversations (connected only). */
export async function listWahaConnections(ctx: TenantContext): Promise<WahaConnectionPick[]> {
  const connections = await listChannelConnectionsForTenant(getDb(), ctx);
  return connections
    .filter((c) => c.kind === "waha" && c.status === "connected")
    .map(({ id, name }) => ({ id, name }));
}

export type { DealRow };

// --- AI (observer v1) ----------------------------------------------------------

export async function listOrgLlmCredentials(ctx: TenantContext): Promise<LlmCredentialPublic[]> {
  return listLlmCredentials(getDb(), ctx);
}

export async function listOrgAgents(ctx: TenantContext): Promise<AgentRow[]> {
  return listAgents(getDb(), ctx);
}

export async function listOrgKnowledge(ctx: TenantContext): Promise<KnowledgeEntryRow[]> {
  return listKnowledgeEntries(getDb(), ctx);
}

export async function listOrgSuggestions(ctx: TenantContext): Promise<AgentSuggestionRow[]> {
  return listAgentSuggestions(getDb(), ctx, { limit: 100 });
}

export async function listOrgBrainEntries(ctx: TenantContext): Promise<MemoryEntryRow[]> {
  return listBrainEntries(getDb(), ctx, { limit: 200 });
}

export async function listOrgStaleBrainEntries(ctx: TenantContext): Promise<MemoryEntryRow[]> {
  return listStaleBrainEntries(getDb(), ctx);
}

// --- AI drafts -------------------------------------------------------------

/** Pending draft suggestions for the conversation thread (messaging:write). */
export async function listConversationDrafts(
  ctx: TenantContext,
  conversationId: string,
): Promise<AgentSuggestionRow[]> {
  return listDrafts(getDb(), ctx, conversationId);
}

/** Last inbound timestamp — draft staleness, independent of the listed window. */
export async function getLastInboundAt(
  ctx: TenantContext,
  conversationId: string,
): Promise<Date | null> {
  return getConversationLastInboundAt(getDb(), ctx, { conversationId });
}
