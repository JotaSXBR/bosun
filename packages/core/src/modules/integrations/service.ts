import { randomBytes } from "node:crypto";

import type { ChannelProvider } from "@crm/channels";
import { createChannelProvider } from "@crm/channels";
import type { Database, DbExecutor } from "@crm/db";
import { withServiceAccess, withTenant } from "@crm/db";

import { NotFoundError } from "../../errors";
import { decryptJson, encryptJson } from "../../lib/crypto";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import type { ChannelConnectionRow } from "./repository";
import {
  deleteChannelConnection,
  findConnectionByWebhookToken,
  getChannelConnection,
  insertChannelConnection,
  listChannelConnections,
  updateConnectionStatus,
} from "./repository";
import type { ChannelCredentials, CreateChannelConnectionInput } from "./schemas";
import {
  createChannelConnectionInput,
  metaCloudCredentialsSchema,
  wahaCredentialsSchema,
} from "./schemas";

/** Requires integrations:read (every org member). */
export async function listChannelConnectionsForTenant(
  db: Database,
  ctx: TenantContext,
): Promise<ChannelConnectionRow[]> {
  assertPermission(ctx, { integrations: ["read"] });
  return listChannelConnections(db, ctx.organizationId);
}

/**
 * Requires integrations:manage. Generates the unguessable webhook token and
 * encrypts credentials at rest; status stays 'pending' until the provider is
 * reachable (see refreshConnectionStatus).
 */
export async function createChannelConnection(
  db: Database,
  ctx: TenantContext,
  input: CreateChannelConnectionInput,
): Promise<ChannelConnectionRow> {
  assertPermission(ctx, { integrations: ["manage"] });
  const parsed = createChannelConnectionInput.parse(input);
  return insertChannelConnection(db, ctx.organizationId, {
    kind: parsed.kind,
    name: parsed.name,
    credentialsEncrypted: encryptJson(parsed.credentials),
    webhookToken: randomBytes(24).toString("base64url"),
  });
}

/**
 * Requires integrations:manage. Decrypts credentials, asks the provider for a
 * live status (WAHA: starts/polls the session; Meta: validates the phone
 * number) and persists the result.
 */
export async function refreshConnectionStatus(
  db: Database,
  ctx: TenantContext,
  id: string,
): Promise<ChannelConnectionRow> {
  assertPermission(ctx, { integrations: ["manage"] });
  const conn = await getConnectionOrThrow(db, ctx, id);
  const credentials = decryptJson(conn.credentialsEncrypted);
  const { status } = await providerFromCredentials(conn.kind, credentials).connect();
  await withTenant(db, ctx.organizationId, (tx) =>
    updateConnectionStatus(tx, conn.id, {
      status,
      connectedAt: status === "connected" ? new Date() : null,
      externalRef: externalRefFor(conn.kind, credentials),
    }),
  );
  const updated = await getChannelConnection(db, ctx.organizationId, conn.id);
  if (!updated) throw new NotFoundError("Channel connection", id);
  return updated;
}

/** Requires integrations:manage. */
export async function removeChannelConnection(
  db: Database,
  ctx: TenantContext,
  id: string,
): Promise<void> {
  assertPermission(ctx, { integrations: ["manage"] });
  const deleted = await deleteChannelConnection(db, ctx.organizationId, id);
  if (!deleted) throw new NotFoundError("Channel connection", id);
}

/**
 * Requires integrations:read. Returns the webhook path for a connection; the
 * action layer prefixes the request origin to form the full URL.
 */
export async function getConnectionWebhookUrl(
  db: Database,
  ctx: TenantContext,
  id: string,
): Promise<string> {
  assertPermission(ctx, { integrations: ["read"] });
  const conn = await getConnectionOrThrow(db, ctx, id);
  return `/api/webhooks/channels/${conn.webhookToken}`;
}

/**
 * Internal — no TenantContext by design. Webhook ingestion resolves the
 * connection under service scope (token is unguessable; the provider
 * signature is verified by the caller next) and returns it with a ready
 * provider. Returns undefined for an unknown token.
 */
export async function resolveWebhookConnection(
  db: Database,
  webhookToken: string,
): Promise<{ connection: ChannelConnectionRow; provider: ChannelProvider } | undefined> {
  const connection = await withServiceAccess(db, (tx) =>
    findConnectionByWebhookToken(tx, webhookToken),
  );
  if (!connection) return undefined;
  const provider = providerFromCredentials(
    connection.kind,
    decryptJson(connection.credentialsEncrypted),
  );
  return { connection, provider };
}

/**
 * Service-scope connection.status write — runs inside the caller's
 * withTenant transaction (the organizationId comes from the authenticated
 * connection row, never from the event payload).
 */
export async function applyConnectionStatus(
  executor: DbExecutor,
  connectionId: string,
  status: string,
): Promise<void> {
  await updateConnectionStatus(executor, connectionId, {
    status,
    connectedAt: status === "connected" ? new Date() : null,
  });
}

async function getConnectionOrThrow(
  db: Database,
  ctx: TenantContext,
  id: string,
): Promise<ChannelConnectionRow> {
  const conn = await getChannelConnection(db, ctx.organizationId, id);
  if (!conn) throw new NotFoundError("Channel connection", id);
  return conn;
}

function providerFromCredentials(kind: string, raw: unknown): ChannelProvider {
  if (kind === "waha") {
    const credentials = wahaCredentialsSchema.parse(raw);
    return createChannelProvider({ kind: "waha", session: "default", ...credentials });
  }
  const credentials = metaCloudCredentialsSchema.parse(raw);
  return createChannelProvider({ kind: "meta_cloud", ...credentials });
}

function externalRefFor(kind: string, raw: unknown): string | undefined {
  const credentials = raw as ChannelCredentials;
  if (kind === "waha") {
    return "session" in credentials ? credentials.session : undefined;
  }
  return "phoneNumberId" in credentials ? credentials.phoneNumberId : undefined;
}
