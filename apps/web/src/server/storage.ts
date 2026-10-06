import "server-only";

import { getServerEnv, isConfigured } from "@crm/config";
import type { StorageProvider } from "@crm/storage";
import { S3StorageProvider } from "@crm/storage";

let cached: StorageProvider | null = null;

/**
 * Lazily built storage singleton. Throws when STORAGE_S3_* envs are missing
 * — actions surface that as a friendly error, routes as 503.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const env = getServerEnv();
  if (!isConfigured(env, "storage")) {
    throw new Error("Object storage is not configured (STORAGE_S3_*)");
  }
  cached = new S3StorageProvider({
    bucket: env.storage.bucket!,
    region: env.storage.region ?? "us-east-1",
    endpoint: env.storage.endpoint,
    accessKeyId: env.storage.accessKeyId!,
    secretAccessKey: env.storage.secretAccessKey!,
    forcePathStyle: env.storage.forcePathStyle,
  });
  return cached;
}
