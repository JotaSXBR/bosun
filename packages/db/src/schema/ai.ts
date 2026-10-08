import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { crmAppRole, tenantPredicate } from "./audit";
import { organizations, users } from "./auth";
import { conversations } from "./messaging";

/**
 * BYOK: one org's LLM credential. `api_key_encrypted` holds an
 * `encryptJson` payload (AES-256-GCM, CHANNEL_CREDENTIALS_KEY) — the raw
 * key never leaves the server and is never returned by reads.
 * `priority` orders the fallback chain the observer walks. `model` is the
 * provider-specific model id (e.g. `openai/gpt-5-mini` on OpenRouter).
 * `zdr` requests zero-data-retention routing where supported.
 */
export const orgLlmCredentials = pgTable(
  "org_llm_credentials",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    apiKeyEncrypted: text().notNull(),
    label: text(),
    model: text().notNull(),
    priority: integer().notNull().default(0),
    zdr: boolean().notNull().default(false),
    status: text().notNull().default("active"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("org_llm_credentials_org_idx").on(t.organizationId),
    uniqueIndex("org_llm_credentials_org_provider_priority_idx").on(
      t.organizationId,
      t.provider,
      t.priority,
    ),
    pgPolicy("org_llm_credentials_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * Declarative per-org agent configuration (v1: exists as config — the
 * observer's suggestions target exactly these fields; agents only run
 * autonomously in later slices). `model_ref` mirrors
 * `@crm/ai` ModelRef `{ provider, modelId }` — null means the org's
 * top-priority credential applies.
 */
export const agents = pgTable(
  "agents",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    specialty: text(),
    status: text().notNull().default("draft"),
    modelRef: jsonb(),
    systemPrompt: text().notNull().default(""),
    businessRules: text(),
    toolsAllowlist: jsonb().notNull().default([]),
    availabilityWindow: jsonb(),
    memoryTokenCap: integer(),
    toolExecutionLimit: integer(),
    signatureLine: text(),
    brainAccess: text().notNull().default("off"),
    brainTypes: jsonb().notNull().default([]),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("agents_org_name_idx").on(t.organizationId, t.name),
    index("agents_org_idx").on(t.organizationId),
    pgPolicy("agents_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * Customer-facing knowledge (FAQs, policies, canned answers) — distinct
 * from the internal second-brain layer (deferred slice). `source` records
 * whether a human wrote it or an approved suggestion created it.
 */
export const knowledgeEntries = pgTable(
  "knowledge_entries",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text().notNull(),
    content: text().notNull(),
    status: text().notNull().default("active"),
    source: text().notNull().default("manual"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("knowledge_entries_org_idx").on(t.organizationId),
    pgPolicy("knowledge_entries_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * A proposed configuration change emitted by the observer. `payload` is
 * a partial-field diff against the target entity (or the full create
 * payload when `target_id` is null → creating a new entity). Nothing
 * applies without a human approving — same review contract as the spec.
 */
export const agentSuggestions = pgTable(
  "agent_suggestions",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    targetType: text().notNull(),
    targetId: uuid(),
    payload: jsonb().notNull(),
    rationale: text().notNull(),
    status: text().notNull().default("pending"),
    sourceConversationId: uuid().references(() => conversations.id, {
      onDelete: "set null",
    }),
    reviewedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    // Who proposed the change — null means the observer (system). Review
    // rules: ai:manage may not approve their own proposal (four-eyes);
    // owner is sovereign and always may.
    proposedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("agent_suggestions_org_status_idx").on(t.organizationId, t.status),
    pgPolicy("agent_suggestions_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();

/**
 * One row per LLM call attempt — token/cost accounting exists so spend
 * caps and reporting land later without re-instrumenting.
 */
export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentId: uuid().references(() => agents.id, { onDelete: "set null" }),
    credentialId: uuid().references(() => orgLlmCredentials.id, {
      onDelete: "set null",
    }),
    callKind: text().notNull(),
    provider: text().notNull(),
    model: text().notNull(),
    tokensIn: integer().notNull().default(0),
    tokensOut: integer().notNull().default(0),
    latencyMs: integer(),
    status: text().notNull().default("ok"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_usage_events_org_idx").on(t.organizationId, t.createdAt),
    pgPolicy("ai_usage_events_tenant_isolation", {
      for: "all",
      to: crmAppRole,
      using: tenantPredicate,
      withCheck: tenantPredicate,
    }),
  ],
).enableRLS();
