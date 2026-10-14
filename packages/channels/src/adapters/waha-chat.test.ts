// WAHA chat features — webhook parsing (reaction/edited/revoked/presence)
// and the outbound chat surface (seen, presence, reaction, edit, delete,
// media download, reply_to, voice notes).
import { describe, expect, it } from "vitest";

import { mockFetch, wahaRequest } from "./test-utils";
import { WahaChannelProvider } from "./waha";

const wahaConfig = {
  baseUrl: "https://waha.example.com/",
  apiKey: "key-1",
  session: "default",
  webhookHmacKey: "hmac-secret",
};

const provider = (fetch?: ReturnType<typeof mockFetch>["fetch"]) =>
  new WahaChannelProvider(wahaConfig, fetch ? { fetch } : undefined);

describe("WahaChannelProvider — chat event parsing", () => {
  it("parses message.reaction with emoji and full message id", () => {
    const req = wahaRequest({
      event: "message.reaction",
      session: "default",
      payload: {
        id: "false_7911@c.us_REACTION_ID",
        from: "7911@c.us",
        fromMe: false,
        participant: "7911@c.us",
        reaction: { text: "🙏", messageId: "true_7911@c.us_MSG1" },
      },
    });
    expect(provider().parseWebhook(req)).toEqual([
      {
        type: "message.reaction",
        messageExternalId: "true_7911@c.us_MSG1",
        emoji: "🙏",
        actorChannelUserId: "7911@c.us",
        fromMe: false,
      },
    ]);
  });

  it("parses reaction removal (empty text) and our own reactions", () => {
    const req = wahaRequest({
      event: "message.reaction",
      session: "default",
      payload: {
        id: "true_7911@c.us_REACTION_ID",
        from: "7911@c.us",
        fromMe: true,
        reaction: { text: "", messageId: "false_7911@c.us_MSG2" },
      },
    });
    expect(provider().parseWebhook(req)).toEqual([
      expect.objectContaining({
        type: "message.reaction",
        messageExternalId: "false_7911@c.us_MSG2",
        emoji: "",
        fromMe: true,
      }),
    ]);
  });

  it("parses message.edited into candidate external ids", () => {
    const req = wahaRequest({
      event: "message.edited",
      session: "default",
      payload: {
        id: "false_7911@c.us_EDIT_ACTION",
        editedMessageId: "MSG1",
        body: "new text",
      },
    });
    expect(provider().parseWebhook(req)).toEqual([
      {
        type: "message.edited",
        messageExternalIds: ["true_7911@c.us_MSG1", "false_7911@c.us_MSG1"],
        newText: "new text",
      },
    ]);
  });

  it("parses message.revoked from the before.id", () => {
    const req = wahaRequest({
      event: "message.revoked",
      session: "default",
      payload: {
        before: { id: "false_7911@c.us_MSG9", body: "hi" },
        after: { id: "false_7911@c.us_MSG9", body: "" },
      },
    });
    expect(provider().parseWebhook(req)).toEqual([
      { type: "message.revoked", messageExternalId: "false_7911@c.us_MSG9" },
    ]);
  });

  it("parses presence.update into contact.presence per participant", () => {
    const req = wahaRequest({
      event: "presence.update",
      session: "default",
      payload: {
        id: "7911@c.us",
        presences: [
          { participant: "7911@c.us", lastKnownPresence: "typing" },
          { participant: "7911@c.us", lastKnownPresence: "bogus" },
        ],
      },
    });
    expect(provider().parseWebhook(req)).toEqual([
      {
        type: "contact.presence",
        chatId: "7911@c.us",
        participant: "7911@c.us",
        presence: "typing",
      },
    ]);
  });
});

describe("WahaChannelProvider — chat actions", () => {
  it("sendSeen posts to /api/sendSeen", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await provider(fetchImpl).sendSeen("7911@c.us");
    expect(calls[0]?.url).toBe("https://waha.example.com/api/sendSeen");
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toEqual({
      session: "default",
      chatId: "7911@c.us",
    });
  });

  it("sendPresence posts chat presence to /api/{session}/presence", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await provider(fetchImpl).sendPresence("7911@c.us", "recording");
    expect(calls[0]?.url).toBe("https://waha.example.com/api/default/presence");
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toEqual({
      chatId: "7911@c.us",
      presence: "recording",
    });
  });

  it("subscribePresence hits the per-chat subscribe endpoint", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await provider(fetchImpl).subscribePresence("7911@c.us");
    expect(calls[0]?.url).toBe(
      "https://waha.example.com/api/default/presence/7911%40c.us/subscribe",
    );
  });

  it("sendReaction puts the emoji; empty string removes", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const p = provider(fetchImpl);
    await p.sendReaction("true_7911@c.us_MSG1", "👍");
    await p.sendReaction("true_7911@c.us_MSG1", "");
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(calls[0]?.url).toBe("https://waha.example.com/api/reaction");
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toMatchObject({
      messageId: "true_7911@c.us_MSG1",
      reaction: "👍",
    });
    expect(JSON.parse(calls[1]?.init?.body ?? "{}")).toMatchObject({ reaction: "" });
  });

  it("editMessage and deleteMessage hit the chat message endpoints", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const p = provider(fetchImpl);
    await p.editMessage("7911@c.us", "true_7911@c.us_MSG1", "edited");
    await p.deleteMessage("7911@c.us", "true_7911@c.us_MSG1");
    expect(calls[0]?.url).toBe(
      "https://waha.example.com/api/default/chats/7911%40c.us/messages/true_7911%40c.us_MSG1",
    );
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toEqual({ text: "edited" });
    expect(calls[1]?.url).toBe(calls[0]?.url);
    expect(calls[1]?.init?.method).toBe("DELETE");
  });

  it("fetchMedia streams bytes with the api key", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const result = await provider(fetchImpl).fetchMedia("https://waha.example.com/api/files/x.ogg");
    expect(calls[0]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
    expect(result.body).toBeInstanceOf(Uint8Array);
  });

  it("fetchMedia refuses urls outside the WAHA host (api key must not leak)", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await expect(
      provider(fetchImpl).fetchMedia("http://169.254.169.254/meta"),
    ).rejects.toThrowError(/outside the WAHA host/);
    expect(calls).toHaveLength(0);
  });

  it("fetchMedia re-roots WAHA-stamped file urls onto the configured host", async () => {
    // WAHA builds media.url from its own WAHA_BASE_URL (default
    // localhost:3000) — the /api/files/* path is the same file on the host
    // we configured, so re-root it and keep the api key on baseUrl.
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await provider(fetchImpl).fetchMedia("http://localhost:3000/api/files/true_1@c.us_X.webp");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://waha.example.com/api/files/true_1@c.us_X.webp");
    expect(calls[0]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
  });

  it("fetchMedia keeps the query string when re-rooting", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await provider(fetchImpl).fetchMedia("http://localhost:3000/api/files/default/x.oga?foo=1");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://waha.example.com/api/files/default/x.oga?foo=1");
  });

  it("fetchMedia refuses foreign urls outside /api/files/", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    await expect(provider(fetchImpl).fetchMedia("http://evil.com/api/other")).rejects.toThrowError(
      /outside the WAHA host/,
    );
    expect(calls).toHaveLength(0);
  });

  it("fetchMedia refusal reports only the origin — signed query stays out", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: {} }));
    const error = await provider(fetchImpl)
      .fetchMedia("http://169.254.169.254/latest/meta?sig=secret-token")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("origin http://169.254.169.254");
    expect((error as Error).message).not.toContain("secret-token");
    expect(calls).toHaveLength(0);
  });

  it("fetchMessageMedia downloads the media url the message GET returns", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? { json: { media: { url: "http://localhost:3000/api/files/x.webp" } } }
        : { json: {} },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    expect(calls).toHaveLength(2);
    // Hop 1: ask WAHA to download the message's media on demand.
    expect(calls[0]?.url).toBe(
      "https://waha.example.com/api/default/chats/7911%40c.us/messages/false_7911%40c.us_M1?downloadMedia=true",
    );
    expect(calls[0]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
    // Hop 2: the WAHA-stamped localhost url is re-rooted onto baseUrl.
    expect(calls[1]?.url).toBe("https://waha.example.com/api/files/x.webp");
    expect(calls[1]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
  });

  it("fetchMessageMedia returns null when the message carries no media url", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { id: "m1" } }));
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("fetchMessageMedia falls back to the serialized message-id file when url is the CDN .enc", async () => {
    // GOWS stickers: media.url is the WhatsApp CDN .enc (unusable) and
    // media.filename is the bare stanza — but WAHA stores the object as
    // {session}/{serializedId}.{ext} (S3 key convention) and the proxied
    // url is flat /api/files/{serializedId}.{ext}.
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? {
            json: {
              media: {
                url: "https://mmg.whatsapp.net/v/t62.x/abc.enc?sig=1",
                filename: "3EB0ABC.webp",
                mimetype: "image/webp",
              },
            },
          }
        : url.includes("false_7911%40c.us_M1.webp")
          ? { json: {} }
          : { status: 404 },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    // The mmg url is refused pre-flight (no request leaves for whatsapp.net),
    // so the second call is already the serialized-id file fetch.
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe("https://waha.example.com/api/files/false_7911%40c.us_M1.webp");
    expect(calls[1]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
  });

  it("fetchMessageMedia derives the extension from the mimetype when filename is null", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? { json: { media: { url: null, filename: null, mimetype: "image/webp" } } }
        : url.includes("M1.webp")
          ? { json: {} }
          : { status: 404 },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    expect(calls[1]?.url).toBe("https://waha.example.com/api/files/false_7911%40c.us_M1.webp");
  });

  it("fetchMessageMedia falls back to filename when media.url is null", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? { json: { media: { url: null, filename: "sticker.webp", mimetype: "image/webp" } } }
        : url.includes("sticker.webp")
          ? { json: {} }
          : { status: 404 },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    // Serialized-id candidates 404 first (mock), then the filename path.
    expect(calls.map((c) => c.url)).toEqual([
      expect.stringContaining("downloadMedia=true"),
      "https://waha.example.com/api/files/false_7911%40c.us_M1.webp",
      "https://waha.example.com/api/files/default/false_7911%40c.us_M1.webp",
      "https://waha.example.com/api/files/default/sticker.webp",
    ]);
  });

  it("fetchMessageMedia tries the bare stanza when the serialized name isn't stored", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) => {
      if (url.includes("downloadMedia=true")) {
        return { json: { media: { url: null, filename: "doc.pdf", mimetype: "application/pdf" } } };
      }
      return url.endsWith("/api/files/default/M1.pdf") ? { json: {} } : { status: 404 };
    });
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    expect(calls.map((c) => c.url)).toEqual([
      expect.stringContaining("downloadMedia=true"),
      "https://waha.example.com/api/files/false_7911%40c.us_M1.pdf",
      "https://waha.example.com/api/files/default/false_7911%40c.us_M1.pdf",
      "https://waha.example.com/api/files/default/doc.pdf",
      "https://waha.example.com/api/files/doc.pdf",
      "https://waha.example.com/api/files/default/M1.pdf",
    ]);
  });

  it("fetchMessageMedia fetches http S3 pre-signed urls anonymously", async () => {
    // Internal RustFS/MinIO endpoints are plain http — the url comes from
    // WAHA's authenticated downloadMedia response, so an anonymous fetch
    // (no api key) is safe.
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? {
            json: {
              media: {
                url: "http://rustfs:9000/bucket/default/3EB0.webp?X-Amz-Signature=abc",
                filename: null,
                mimetype: "image/webp",
              },
            },
          }
        : { json: {} },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe("http://rustfs:9000/bucket/default/3EB0.webp?X-Amz-Signature=abc");
    expect(calls[1]?.init).toBeUndefined();
  });

  it("fetchMessageMedia fetches S3 pre-signed urls anonymously (api key never leaves WAHA)", async () => {
    // WAHA_MEDIA_STORAGE=s3 without the files proxy stamps a pre-signed
    // https url — fetchable as-is, but only WITHOUT the api key.
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? {
            json: {
              media: {
                url: "https://rustfs.example.com/bucket/default/3EB0.webp?X-Amz-Signature=abc",
                filename: null,
                mimetype: "image/webp",
              },
            },
          }
        : { json: {} },
    );
    const media = await provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1");
    expect(media).not.toBeNull();
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe(
      "https://rustfs.example.com/bucket/default/3EB0.webp?X-Amz-Signature=abc",
    );
    expect(calls[1]?.init).toBeUndefined();
  });

  it("fetchMessageMedia never fetches the encrypted WhatsApp CDN anonymously", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.includes("downloadMedia=true")
        ? {
            json: {
              media: {
                url: "https://mmg.whatsapp.net/v/t62.x/abc.enc?sig=1",
                filename: null,
                mimetype: "image/webp",
              },
            },
          }
        : { status: 404 },
    );
    await expect(
      provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1"),
    ).rejects.toThrowError(/no downloadable media/);
    // Every call left for the WAHA host — nothing went to mmg.
    expect(calls.every((c) => !c.url.includes("whatsapp.net"))).toBe(true);
  });

  it("fetchMessageMedia surfaces WAHA's download error when nothing is fetchable", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({
      json: {
        media: {
          url: null,
          filename: null,
          error: { code: 13, details: "download failed with status code 403" },
        },
      },
    }));
    await expect(
      provider(fetchImpl).fetchMessageMedia("7911@c.us", "false_7911@c.us_M1"),
    ).rejects.toThrowError(/no downloadable media.*code 13.*403/);
    expect(calls).toHaveLength(1);
  });
});

describe("WahaChannelProvider — reply and voice notes", () => {
  it("adds reply_to when replyToId is set", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { id: "m1" } }));
    await provider(fetchImpl).sendMessage({
      to: "7911@c.us",
      content: { type: "text", text: "ok" },
      replyToId: "false_7911@c.us_ORIG",
    });
    expect(JSON.parse(calls[0]?.init?.body ?? "{}")).toMatchObject({
      reply_to: "false_7911@c.us_ORIG",
    });
  });

  it("voiceNote audio routes to sendVoice with convert and ogg target", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { id: "m2" } }));
    await provider(fetchImpl).sendMessage({
      to: "7911@c.us",
      content: {
        type: "media",
        mediaKind: "audio",
        voiceNote: true,
        source: { type: "url", url: "https://cdn.example.com/a.webm" },
        mimeType: "audio/webm;codecs=opus",
        filename: "audio.webm",
      },
    });
    expect(calls[0]?.url).toBe("https://waha.example.com/api/sendVoice");
    const body = JSON.parse(calls[0]?.init?.body ?? "{}") as {
      convert?: boolean;
      file?: { mimetype?: string; filename?: string };
    };
    expect(body.convert).toBe(true);
    // The payload describes the converted target, not the webm source.
    expect(body.file?.mimetype).toBe("audio/ogg; codecs=opus");
    expect(body.file?.filename).toBe("audio.ogg");
  });

  it("fetchContactAvatar downloads the CDN url without the api key", async () => {
    const { fetch: fetchImpl, calls } = mockFetch((url) =>
      url.startsWith("https://waha.example.com")
        ? { json: { profilePictureURL: "https://pps.whatsapp.net/abc.jpg" } }
        : { json: {} },
    );
    const avatar = await provider(fetchImpl).fetchContactAvatar("7911@c.us");
    expect(avatar).not.toBeNull();
    expect(calls[0]?.url).toContain("/api/contacts/profile-picture");
    expect(calls[0]?.init?.headers?.["X-Api-Key"]).toBe("key-1");
    // CDN hop is anonymous — never send the WAHA key off-host.
    expect(calls[1]?.url).toBe("https://pps.whatsapp.net/abc.jpg");
    expect(calls[1]?.init).toBeUndefined();
  });

  it("fetchContactAvatar returns null when the contact has no photo", async () => {
    const { fetch: fetchImpl } = mockFetch(() => ({
      json: { profilePictureURL: null },
    }));
    expect(await provider(fetchImpl).fetchContactAvatar("7911@c.us")).toBeNull();
  });

  it("plain audio still goes through sendFile", async () => {
    const { fetch: fetchImpl, calls } = mockFetch(() => ({ json: { id: "m3" } }));
    await provider(fetchImpl).sendMessage({
      to: "7911@c.us",
      content: {
        type: "media",
        mediaKind: "audio",
        source: { type: "url", url: "https://cdn.example.com/a.mp3" },
        mimeType: "audio/mpeg",
      },
    });
    expect(calls[0]?.url).toBe("https://waha.example.com/api/sendFile");
  });

  it("maps inbound media kind from the mimetype", () => {
    const req = wahaRequest({
      event: "message",
      session: "default",
      payload: {
        id: "false_7911@c.us_M1",
        from: "7911@c.us",
        hasMedia: true,
        mimetype: "audio/ogg; codecs=opus",
        mediaUrl: "http://waha/api/files/x.ogg",
        timestamp: 1700000000,
      },
    });
    const [event] = provider().parseWebhook(req);
    if (event?.type !== "message.received") throw new Error("expected message.received");
    expect(event.content).toMatchObject({ mediaKind: "audio" });
  });
});
