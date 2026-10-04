import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations } from "./auth";

/**
 * A provider account connected by an organization (WAHA session, Meta Cloud
 * phone number). Credentials live encrypted in `credentials_encrypted`
 * (AES-256-GCM via @crm/core crypto); `webhook_token` is the unguessable path
 * segment that authenticates inbound webhooks before provider signature
 * verification.
 */
export const channelConnections = pgTable(
  "channel_connections",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    name: text().notNull(),
    externalRef: text(),
    status: text().notNull().default("pending"),
    credentialsEncrypted: text().notNull(),
    webhookToken: text().notNull(),
    connectedAt: timestamp({ withTimezone: true }),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("channel_connections_webhook_token_idx").on(t.webhookToken),
    index("channel_connections_org_idx").on(t.organizationId),
    check("channel_connections_kind_check", sql`${t.kind} in ('waha', 'meta_cloud')`),
    check(
      "channel_connections_status_check",
      sql`${t.status} in ('pending', 'connected', 'connecting', 'disconnected', 'error')`,
    ),
    pgPolicy("channel_connections_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * A person on the other end of a channel, deduplicated per organization and
 * provider user id (WhatsApp chat id / phone number).
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channelUserId: text().notNull(),
    displayName: text(),
    avatarUrl: text(),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("contacts_org_channel_user_idx").on(t.organizationId, t.channelUserId),
    index("contacts_org_idx").on(t.organizationId),
    pgPolicy("contacts_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/** One conversation thread per (connection, provider chat id). */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channelConnectionId: uuid()
      .notNull()
      .references(() => channelConnections.id, { onDelete: "cascade" }),
    contactId: uuid()
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    externalId: text().notNull(),
    status: text().notNull().default("open"),
    lastMessageAt: timestamp({ withTimezone: true }),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_connection_external_idx").on(t.channelConnectionId, t.externalId),
    index("conversations_org_last_message_idx").on(t.organizationId, t.lastMessageAt.desc()),
    check("conversations_status_check", sql`${t.status} in ('open', 'resolved', 'archived')`),
    pgPolicy("conversations_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * A normalized message (ChannelEvent MessageContent in `content`). The partial
 * unique index on (channel_connection_id, external_id) is the idempotency key
 * for webhook replays — inserts use ON CONFLICT DO NOTHING.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    channelConnectionId: uuid()
      .notNull()
      .references(() => channelConnections.id, { onDelete: "cascade" }),
    contactId: uuid().references(() => contacts.id, { onDelete: "set null" }),
    direction: text().notNull(),
    content: jsonb().notNull(),
    externalId: text(),
    status: text().notNull().default("received"),
    sentAt: timestamp({ withTimezone: true }),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("messages_connection_external_idx")
      .on(t.channelConnectionId, t.externalId)
      .where(sql`${t.externalId} is not null`),
    index("messages_conversation_sent_idx").on(t.conversationId, t.sentAt),
    check("messages_direction_check", sql`${t.direction} in ('inbound', 'outbound')`),
    check(
      "messages_status_check",
      sql`${t.status} in ('received', 'queued', 'sent', 'delivered', 'read', 'failed')`,
    ),
    pgPolicy("messages_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
