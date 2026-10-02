// S3-compatible storage provider (AWS SDK v3). Works against AWS S3 and any
// S3-compatible endpoint (RustFS locally, MinIO, etc.) via `endpoint` +
// `forcePathStyle`.
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageProvider } from "./domain";
import { StorageObjectNotFoundError } from "./domain";

export type S3StorageConfig = {
  bucket: string;
  region: string;
  /** Custom endpoint for S3-compatible stores (e.g. http://localhost:9000). */
  endpoint?: string | undefined;
  forcePathStyle?: boolean | undefined;
  accessKeyId: string;
  secretAccessKey: string;
};

export class S3StorageProvider implements StorageProvider {
  constructor(
    private readonly config: S3StorageConfig,
    private readonly client: S3Client = new S3Client({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      forcePathStyle: config.forcePathStyle ?? Boolean(config.endpoint),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  ) {}

  async upload(input: {
    key: string;
    body: Uint8Array | string;
    contentType?: string;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.key,
        Body: input.body,
        ...(input.contentType ? { ContentType: input.contentType } : {}),
      }),
    );
  }

  async download(key: string): Promise<{ body: Uint8Array; contentType?: string }> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) throw new StorageObjectNotFoundError(key);
      return {
        body: bytes,
        ...(res.ContentType ? { contentType: res.ContentType } : {}),
      };
    } catch (error) {
      if (error instanceof NoSuchKey || error instanceof NotFound) {
        throw new StorageObjectNotFoundError(key);
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error.name === "NoSuchKey" || error.name === "NotFound")
      ) {
        throw new StorageObjectNotFoundError(key);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  async getSignedUrl(
    key: string,
    options: { method: "get" | "put"; expiresInSeconds: number },
  ): Promise<string> {
    const command =
      options.method === "get"
        ? new GetObjectCommand({ Bucket: this.config.bucket, Key: key })
        : new PutObjectCommand({ Bucket: this.config.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: options.expiresInSeconds });
  }
}
