import { DomainError } from "../../errors";

/**
 * Strict international phone → WhatsApp chatId. The input MUST carry a
 * leading "+" (E.164 notation) — that is what proves the caller typed a
 * full international number. Without it a Brazilian local mobile like
 * "11999998888" would pass the digit-count check and map to a wrong
 * country silently; rejecting is the "zero magic" contract. Formatting
 * punctuation after the "+" is ignored; digits must be 8–15, no leading 0.
 */
export function normalizeWhatsAppChatId(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!trimmed.startsWith("+") || !/^[1-9]\d{7,14}$/.test(digits)) {
    throw new DomainError(
      "CONTACT_PHONE_INVALID",
      "Phone must be international format with + and country code (e.g. +55 11 99999-8888)",
    );
  }
  return `${digits}@c.us`;
}

/** True when a stored channelUserId is a WhatsApp-shaped identity. */
export function isWhatsAppChatId(channelUserId: string): boolean {
  return /^\d+@(c\.us|lid)$/.test(channelUserId);
}
