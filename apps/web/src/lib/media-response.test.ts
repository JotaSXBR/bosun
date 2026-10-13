import { describe, expect, it } from "vitest";

import { mediaResponseHeaders } from "./media-response";

const CSP = "sandbox; default-src 'none'";

describe("mediaResponseHeaders", () => {
  it("serves allowlisted types inline with the normalized content-type", () => {
    for (const type of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ]) {
      const headers = mediaResponseHeaders(type, "file.bin");
      expect(headers["content-type"]).toBe(type);
      expect(headers["content-disposition"]).toBe('inline; filename="file.bin"');
      expect(headers["content-security-policy"]).toBe(CSP);
    }
  });

  it("normalizes parameters and case before checking the allowlist", () => {
    const headers = mediaResponseHeaders("Image/PNG; charset=binary", "a.png");
    expect(headers["content-type"]).toBe("image/png");
    expect(headers["content-disposition"]).toMatch(/^inline;/);
  });

  it("forces attachment + octet-stream for active content types", () => {
    for (const type of [
      "text/html",
      "image/svg+xml",
      "application/xhtml+xml",
      "text/javascript",
      "application/xml",
    ]) {
      const headers = mediaResponseHeaders(type, "evil.html");
      expect(headers["content-type"]).toBe("application/octet-stream");
      expect(headers["content-disposition"]).toBe('attachment; filename="evil.html"');
      expect(headers["content-security-policy"]).toBe(CSP);
    }
  });

  it("treats a missing or blank content-type as not allowlisted", () => {
    for (const type of [undefined, null, "", "  "]) {
      const headers = mediaResponseHeaders(type, "file.bin");
      expect(headers["content-type"]).toBe("application/octet-stream");
      expect(headers["content-disposition"]).toMatch(/^attachment/);
    }
  });

  it("omits filename when absent but still forces attachment", () => {
    const headers = mediaResponseHeaders("text/html", undefined);
    expect(headers["content-disposition"]).toBe("attachment");
  });

  it("strips quotes from filenames", () => {
    const headers = mediaResponseHeaders("image/png", 'a"b.png');
    expect(headers["content-disposition"]).toBe('inline; filename="ab.png"');
  });

  it("keeps the private immutable cache header in both branches", () => {
    for (const type of ["image/png", "text/html"]) {
      expect(mediaResponseHeaders(type, "f")["cache-control"]).toBe(
        "private, max-age=86400, immutable",
      );
    }
  });
});
