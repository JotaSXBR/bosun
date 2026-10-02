// Provider-agnostic object storage contract.

export class StorageObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Storage object not found: ${key}`);
    this.name = "StorageObjectNotFoundError";
  }
}

export interface StorageProvider {
  upload(input: { key: string; body: Uint8Array | string; contentType?: string }): Promise<void>;
  download(key: string): Promise<{ body: Uint8Array; contentType?: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl(
    key: string,
    options: { method: "get" | "put"; expiresInSeconds: number },
  ): Promise<string>;
}
