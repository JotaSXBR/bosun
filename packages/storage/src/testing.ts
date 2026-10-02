// In-memory provider for unit tests — no network, no credentials.
import type { StorageProvider } from "./domain";
import { StorageObjectNotFoundError } from "./domain";

export class InMemoryStorageProvider implements StorageProvider {
  readonly objects = new Map<string, { body: Uint8Array; contentType?: string }>();

  upload(input: { key: string; body: Uint8Array | string; contentType?: string }): Promise<void> {
    const body = typeof input.body === "string" ? new TextEncoder().encode(input.body) : input.body;
    this.objects.set(input.key, {
      body,
      ...(input.contentType ? { contentType: input.contentType } : {}),
    });
    return Promise.resolve();
  }

  download(key: string): Promise<{ body: Uint8Array; contentType?: string }> {
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new StorageObjectNotFoundError(key));
    return Promise.resolve(object);
  }

  delete(key: string): Promise<void> {
    if (!this.objects.delete(key)) {
      return Promise.reject(new StorageObjectNotFoundError(key));
    }
    return Promise.resolve();
  }

  getSignedUrl(
    key: string,
    options: { method: "get" | "put"; expiresInSeconds: number },
  ): Promise<string> {
    return Promise.resolve(`memory://fake-signature/${options.method}/${key}`);
  }
}
