// Pure helpers for the media upload server action — FormData → validated
// {input, file}. Kept dependency-free so it is unit-testable.
import { DomainError } from "@crm/core";
import { z } from "zod";

export const MAX_UPLOAD_BYTES = 64 * 1024 * 1024; // WhatsApp document cap

export const mediaFormInput = z.object({
  conversationId: z.uuid(),
  caption: z.string().trim().max(1024).optional(),
  voiceNote: z.boolean().optional(),
  replyToId: z.string().max(200).optional(),
});

export type MediaFormInput = z.infer<typeof mediaFormInput>;

export type MediaKind = "image" | "video" | "audio" | "document";

export function mediaKindOf(mime: string, voiceNote?: boolean): MediaKind {
  if (voiceNote) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

export function formFile(formData: FormData): File {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new DomainError("UPLOAD_EMPTY", "Anexe um arquivo para enviar.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new DomainError("UPLOAD_TOO_LARGE", "Arquivo excede o limite de 64 MB.");
  }
  return file;
}

/** Parses the upload FormData into { validated input, file }. */
export function parseMediaForm(formData: FormData): { input: MediaFormInput; file: File } {
  const input = mediaFormInput.parse({
    conversationId: formData.get("conversationId"),
    caption: formData.get("caption") ?? undefined,
    voiceNote: formData.get("voiceNote") === "true" || undefined,
    replyToId: formData.get("replyToId") ?? undefined,
  });
  return { input, file: formFile(formData) };
}
