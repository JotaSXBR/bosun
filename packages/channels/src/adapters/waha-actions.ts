// WAHA chat actions — outbound send/seen/presence/reaction/edit/delete and
// media download. Standalone functions receiving the provider's request
// helper so waha.ts stays under the file-size limit.
import { z } from "zod";

import type { OutboundMessage, SendMessageResult } from "../domain";
import type { FetchLike } from "./waha-payloads";

type FetchResponse = Awaited<ReturnType<FetchLike>>;

/** fetch already bound to baseUrl + X-Api-Key — path or absolute URL in. */
export type WahaRequest = (
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponse>;

const JSON_HEADERS = { "Content-Type": "application/json" };

function ensureOk(res: FetchResponse, op: string): void {
  if (!res.ok) throw new Error(`WAHA ${op} failed: HTTP ${res.status}`);
}

export async function wahaSendMessage(
  request: WahaRequest,
  session: string,
  message: OutboundMessage,
): Promise<SendMessageResult> {
  const { content } = message;
  let path: string;
  let body: Record<string, unknown>;
  if (content.type === "text") {
    path = "/api/sendText";
    body = { session, chatId: message.to, text: content.text };
  } else {
    if (content.source.type !== "url") {
      throw new Error("WAHA adapter only supports media by URL");
    }
    path =
      content.mediaKind === "audio" && content.voiceNote
        ? "/api/sendVoice"
        : content.mediaKind === "image"
          ? "/api/sendImage"
          : content.mediaKind === "video"
            ? "/api/sendVideo"
            : "/api/sendFile"; // plain audio + documents go through sendFile
    body = {
      session,
      chatId: message.to,
      file: {
        mimetype: content.mimeType,
        filename: content.filename,
        url: content.source.url,
      },
      caption: content.caption,
    };
    // Browser recordings (webm/opus) need transcoding to ogg/opus PTT.
    if (path === "/api/sendVoice") body.convert = true;
  }
  if (message.replyToId) body.reply_to = message.replyToId;
  const res = await request(path, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`WAHA sendMessage failed: HTTP ${res.status} ${await res.text()}`);
  }
  const parsed = z.looseObject({ id: z.string().optional() }).parse(await res.json());
  return { externalId: parsed.id ?? "", status: "sent" };
}

/** Marks the whole chat read — remote sees blue ticks. */
export async function wahaSendSeen(
  request: WahaRequest,
  session: string,
  chatId: string,
): Promise<void> {
  const res = await request("/api/sendSeen", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ session, chatId }),
  });
  ensureOk(res, "sendSeen");
}

/** typing/recording expire ~10s on the remote; paused clears early. */
export async function wahaSendPresence(
  request: WahaRequest,
  session: string,
  chatId: string,
  presence: "typing" | "recording" | "paused",
): Promise<void> {
  const res = await request(`/api/${session}/presence`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ chatId, presence }),
  });
  ensureOk(res, "sendPresence");
}

/** Subscribe to the contact's presence (drives presence.update webhooks). */
export async function wahaSubscribePresence(
  request: WahaRequest,
  session: string,
  chatId: string,
): Promise<void> {
  const res = await request(`/api/${session}/presence/${encodeURIComponent(chatId)}/subscribe`, {
    method: "POST",
  });
  if (!res.ok && res.status !== 404) ensureOk(res, "subscribePresence");
}

/** Empty emoji removes the actor's reaction (WAHA reaction endpoint). */
export async function wahaSendReaction(
  request: WahaRequest,
  session: string,
  messageExternalId: string,
  emoji: string,
): Promise<void> {
  const res = await request("/api/reaction", {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ session, messageId: messageExternalId, reaction: emoji }),
  });
  ensureOk(res, "sendReaction");
}

/** A chat message targeted for edit/delete. */
export type WahaMessageTarget = { chatId: string; messageExternalId: string };

const chatMessagePath = (session: string, target: WahaMessageTarget) =>
  `/api/${session}/chats/${encodeURIComponent(target.chatId)}/messages/${encodeURIComponent(target.messageExternalId)}`;

export async function wahaEditMessage(
  request: WahaRequest,
  session: string,
  target: WahaMessageTarget,
  text: string,
): Promise<void> {
  const res = await request(chatMessagePath(session, target), {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ text }),
  });
  ensureOk(res, "editMessage");
}

/** Revokes the message "for everyone" — remote shows the deleted placeholder. */
export async function wahaDeleteMessage(
  request: WahaRequest,
  session: string,
  target: WahaMessageTarget,
): Promise<void> {
  const res = await request(chatMessagePath(session, target), { method: "DELETE" });
  ensureOk(res, "deleteMessage");
}

/** Inbound media lives on the WAHA host — fetch with the api key and stream. */
export async function wahaFetchMedia(
  request: WahaRequest,
  url: string,
): Promise<{ body: Uint8Array; contentType: string | null }> {
  const res = await request(url);
  ensureOk(res, "fetchMedia");
  return {
    body: new Uint8Array(await res.arrayBuffer()),
    contentType: res.headers.get("content-type"),
  };
}
