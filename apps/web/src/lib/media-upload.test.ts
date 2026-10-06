import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES, mediaKindOf, parseMediaForm } from "./media-upload";

const CONV_ID = "123e4567-e89b-42d3-a456-426614174000";

function formWith(fields: Record<string, string | File>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

describe("mediaKindOf", () => {
  it("maps mime prefixes to media kinds; voiceNote forces audio", () => {
    expect(mediaKindOf("image/png")).toBe("image");
    expect(mediaKindOf("video/mp4")).toBe("video");
    expect(mediaKindOf("audio/ogg")).toBe("audio");
    expect(mediaKindOf("application/pdf")).toBe("document");
    expect(mediaKindOf("video/mp4", true)).toBe("audio");
  });
});

describe("parseMediaForm", () => {
  const file = new File([new Uint8Array([1, 2, 3])], "doc.pdf", { type: "application/pdf" });

  it("parses a valid upload form", () => {
    const { input, file: parsed } = parseMediaForm(
      formWith({
        conversationId: CONV_ID,
        caption: "hello",
        voiceNote: "true",
        file,
      }),
    );
    expect(input).toEqual({ conversationId: CONV_ID, caption: "hello", voiceNote: true });
    expect(parsed.name).toBe("doc.pdf");
  });

  it("rejects missing/empty/oversized files with domain errors", () => {
    expect(() => parseMediaForm(formWith({ conversationId: CONV_ID }))).toThrowError(
      /Anexe um arquivo/,
    );
    const empty = new File([], "x.pdf");
    expect(() => parseMediaForm(formWith({ conversationId: CONV_ID, file: empty }))).toThrowError(
      /Anexe um arquivo/,
    );
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.bin");
    expect(() => parseMediaForm(formWith({ conversationId: CONV_ID, file: big }))).toThrowError(
      /64 MB/,
    );
  });

  it("rejects a bad conversation id", () => {
    expect(() => parseMediaForm(formWith({ conversationId: "nope", file }))).toThrowError();
  });
});
