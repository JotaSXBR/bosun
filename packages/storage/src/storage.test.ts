import { describe, expect, it } from "vitest";

import { StorageObjectNotFoundError, tenantObjectKey } from "./index";
import { InMemoryStorageProvider } from "./testing";

const ORG = "018f8b9a-7c3d-7f2e-9a4b-1c2d3e4f5a6b";

describe("tenantObjectKey", () => {
  it("builds org-scoped keys", () => {
    expect(tenantObjectKey(ORG, "uploads", "file.pdf")).toBe(`org/${ORG}/uploads/file.pdf`);
  });

  it("rejects invalid org ids and unsafe segments", () => {
    expect(() => tenantObjectKey("not-a-uuid", "f")).toThrow();
    expect(() => tenantObjectKey(ORG)).toThrow();
    expect(() => tenantObjectKey(ORG, "..")).toThrow();
    expect(() => tenantObjectKey(ORG, "")).toThrow();
    expect(() => tenantObjectKey(ORG, "a/b")).toThrow();
    expect(() => tenantObjectKey(ORG, "a\\b")).toThrow();
    expect(() => tenantObjectKey(ORG, ".hidden ok?")).toThrow();
    expect(() => tenantObjectKey(ORG, "fine-name_v2.txt")).not.toThrow();
  });
});

describe("InMemoryStorageProvider", () => {
  it("upload/download/delete round-trip", async () => {
    const storage = new InMemoryStorageProvider();
    await storage.upload({ key: "k1", body: "hello", contentType: "text/plain" });
    const res = await storage.download("k1");
    expect(new TextDecoder().decode(res.body)).toBe("hello");
    expect(res.contentType).toBe("text/plain");
    await storage.delete("k1");
    await expect(storage.download("k1")).rejects.toBeInstanceOf(StorageObjectNotFoundError);
  });

  it("fails on missing keys", async () => {
    const storage = new InMemoryStorageProvider();
    await expect(storage.download("nope")).rejects.toBeInstanceOf(StorageObjectNotFoundError);
    await expect(storage.delete("nope")).rejects.toBeInstanceOf(StorageObjectNotFoundError);
  });

  it("returns a fake signed url", async () => {
    const storage = new InMemoryStorageProvider();
    const url = await storage.getSignedUrl("k", {
      method: "get",
      expiresInSeconds: 60,
    });
    expect(url).toContain("get");
  });
});
