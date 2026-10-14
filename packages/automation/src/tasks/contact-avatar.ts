import { getServerEnv, isConfigured } from "@crm/config";
import { updateContactAvatar } from "@crm/core/contacts";
import { providerForConnection } from "@crm/core/integrations";
import { getDb, withTenant } from "@crm/db";
import { createLogger } from "@crm/observability";
import type { StorageProvider } from "@crm/storage";
import { S3StorageProvider, tenantObjectKey } from "@crm/storage";
import { z } from "zod";

const logger = createLogger({ bindings: { component: "jobs" } });

export const contactAvatarPayload = z.object({
  organizationId: z.uuid(),
  contactId: z.uuid(),
  channelConnectionId: z.uuid(),
  channelUserId: z.string(),
});

export type ContactAvatarPayload = z.infer<typeof contactAvatarPayload>;

let cachedStorage: StorageProvider | null = null;

function storage(): StorageProvider | null {
  if (cachedStorage) return cachedStorage;
  const env = getServerEnv();
  if (!isConfigured(env, "storage")) return null;
  cachedStorage = new S3StorageProvider({
    bucket: env.storage.bucket!,
    region: env.storage.region ?? "us-east-1",
    endpoint: env.storage.endpoint,
    accessKeyId: env.storage.accessKeyId!,
    secretAccessKey: env.storage.secretAccessKey!,
    forcePathStyle: env.storage.forcePathStyle,
  });
  return cachedStorage;
}

/**
 * Pulls the contact's profile picture from the channel provider into our
 * object storage and points `contacts.avatarUrl` at the authenticated
 * proxy route. Every path stamps `avatarFetchedAt` — success or not — so
 * the ingest heal doesn't re-enqueue on every message.
 */
export async function contactAvatarHandler(payload: unknown): Promise<{ ok: boolean }> {
  const parsed = contactAvatarPayload.parse(payload);
  const db = getDb();
  const provider = await providerForConnection(
    db,
    parsed.organizationId,
    parsed.channelConnectionId,
  );
  const avatar = provider.fetchContactAvatar
    ? await provider.fetchContactAvatar(parsed.channelUserId)
    : null;

  // Only point avatarUrl at the proxy when the bytes actually landed —
  // a URL without the object would 404 forever (fetchedAt is stamped
  // either way, so a missing bucket wouldn't retry).
  let update: { avatarUrl?: string; avatarKey?: string } = {};
  if (avatar) {
    const store = storage();
    if (store) {
      const key = tenantObjectKey(parsed.organizationId, "contact-avatar", parsed.contactId);
      await store.upload({
        key,
        body: avatar.body,
        contentType: avatar.contentType ?? undefined,
      });
      update = { avatarUrl: `/api/contacts/${parsed.contactId}/avatar`, avatarKey: key };
    } else {
      logger.warn("contact-avatar: storage not configured, skipping upload");
    }
  }
  await withTenant(db, parsed.organizationId, (tx) =>
    updateContactAvatar(tx, parsed.contactId, update),
  );
  return { ok: true };
}
