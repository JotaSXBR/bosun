// Public widget surface of the messaging module. The visitor authenticates
// with an unguessable session token (site_chat_sessions) — no user session,
// no tenant context — so every entry point resolves identity under
// withServiceAccess and only then enters withTenant for writes. The
// session binds to the contact the visitor claimed in the pre-form; there
// is no proof of email ownership (standard for anonymous chat widgets).
import { randomBytes } from "node:crypto";

import type { RawWebhookRequest } from "@crm/channels";
import type { WidgetConfig } from "@crm/core/integrations";
import { findConnectionByWebhookToken, widgetConfigSchema } from "@crm/core/integrations";
import type { Database } from "@crm/db";
import { withServiceAccess, withTenant } from "@crm/db";
import { z } from "zod";

import { NotFoundError } from "../../errors";
import {
  findLatestConversationForChat,
  findSiteChatSessionByToken,
  insertSiteChatSession,
  touchSiteChatSession,
  upsertContact,
} from "./repository";
import { listWidgetMessages } from "./repository-messages";
import type { ConnectionRef, IngestDeps, WebhookIngestResult } from "./service";
import { ingestChannelWebhook } from "./service";

/** Visitor pre-form — name + valid email + valid phone, all required. */
export const widgetPreFormInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(8).max(15)),
});
export type WidgetPreFormInput = z.input<typeof widgetPreFormInput>;

export type { WidgetConfig };

export type WidgetSession = {
  sessionToken: string;
  config: WidgetConfig;
};

export type WidgetMessage = {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  sentAt: string | null;
};

export type WidgetConversation = {
  conversation: { id: string; status: string } | null;
  messages: WidgetMessage[];
};

function widgetConfigOf(metadata: unknown): WidgetConfig {
  const parsed = widgetConfigSchema.safeParse(metadata ?? {});
  const meta = parsed.success ? parsed.data : {};
  return {
    welcomeText: meta.welcomeText ?? "Olá! Como podemos ajudar?",
    accentColor: meta.accentColor,
    position: meta.position ?? "right",
  };
}

/**
 * Visitor pre-form → session. Resolves the connection by its public
 * embed token, upserts the contact by email (same email anywhere resumes
 * the same thread), then issues the unguessable session token.
 */
export async function createWidgetSession(
  db: Database,
  connectionToken: string,
  input: WidgetPreFormInput,
): Promise<WidgetSession> {
  const parsed = widgetPreFormInput.parse(input);
  const email = parsed.email.toLowerCase();
  const connection = await withServiceAccess(db, (tx) =>
    findConnectionByWebhookToken(tx, connectionToken),
  );
  if (connection?.kind !== "site_chat") {
    throw new NotFoundError("Widget connection");
  }
  const token = randomBytes(24).toString("base64url");
  await withTenant(db, connection.organizationId, async (tx) => {
    const contact = await upsertContact(tx, connection.organizationId, {
      channelUserId: email,
      displayName: parsed.name,
      metadata: { email, phone: parsed.phone, source: "site_chat" },
    });
    await insertSiteChatSession(tx, {
      organizationId: connection.organizationId,
      channelConnectionId: connection.id,
      contactId: contact.id,
      token,
    });
  });
  return { sessionToken: token, config: widgetConfigOf(connection.metadata) };
}

type ResolvedWidgetSession = {
  session: { id: string };
  contact: { id: string; channelUserId: string; displayName: string | null };
  connection: ConnectionRef & { webhookToken: string; metadata: unknown };
};

async function resolveWidgetSession(
  db: Database,
  sessionToken: string,
): Promise<ResolvedWidgetSession | undefined> {
  return withServiceAccess(db, async (tx) => {
    const found = await findSiteChatSessionByToken(tx, sessionToken);
    if (!found) return undefined;
    await touchSiteChatSession(tx, found.session.id);
    return found;
  });
}

/**
 * Visitor message → the standard webhook pipeline: the provider verifies
 * and normalizes the body, ingestChannelEvent persists inside withTenant.
 * Identity fields come from the resolved session row, never from input.
 */
export async function sendWidgetMessage(
  db: Database,
  sessionToken: string,
  input: { text: string; clientMessageId?: string | undefined },
  deps?: IngestDeps,
): Promise<WebhookIngestResult> {
  const found = await resolveWidgetSession(db, sessionToken);
  if (!found) throw new NotFoundError("Widget session");
  const request: RawWebhookRequest = {
    rawBody: JSON.stringify({
      sessionToken,
      text: input.text,
      clientMessageId: input.clientMessageId,
      from: {
        channelUserId: found.contact.channelUserId,
        displayName: found.contact.displayName ?? undefined,
      },
    }),
    headers: {},
    query: {},
  };
  return ingestChannelWebhook(db, found.connection.webhookToken, request, deps);
}

/** Widget history: latest ticket of the visitor's thread + visible messages. */
export async function getWidgetConversation(
  db: Database,
  sessionToken: string,
  opts?: { after?: string; limit?: number },
): Promise<WidgetConversation> {
  const found = await resolveWidgetSession(db, sessionToken);
  if (!found) throw new NotFoundError("Widget session");
  const result = await withServiceAccess(db, async (tx) => {
    const conversation = await findLatestConversationForChat(
      tx,
      found.connection.id,
      found.contact.channelUserId,
    );
    if (!conversation) return { conversation: null, messages: [] };
    const rows = await listWidgetMessages(tx, conversation.id, opts);
    return { conversation, messages: rows };
  });
  return {
    conversation: result.conversation
      ? { id: result.conversation.id, status: result.conversation.status }
      : null,
    messages: result.messages.map((m) => ({
      id: m.id,
      direction: m.direction as "inbound" | "outbound",
      text:
        typeof m.content === "object" && m.content !== null && "text" in m.content
          ? String(m.content.text)
          : "[anexo]",
      sentAt: m.sentAt?.toISOString() ?? null,
    })),
  };
}

/**
 * Session → the stream filter. `contactId` disambiguates
 * `conversation.created` events when the visitor has no ticket yet —
 * adopting any created conversation in the org would leak cross-visitor.
 */
export async function getWidgetStreamTarget(
  db: Database,
  sessionToken: string,
): Promise<
  { organizationId: string; contactId: string; conversationId: string | null } | undefined
> {
  const found = await resolveWidgetSession(db, sessionToken);
  if (!found) return undefined;
  const conversation = await withServiceAccess(db, (tx) =>
    findLatestConversationForChat(tx, found.connection.id, found.contact.channelUserId),
  );
  return {
    organizationId: found.connection.organizationId,
    contactId: found.contact.id,
    conversationId: conversation?.id ?? null,
  };
}
