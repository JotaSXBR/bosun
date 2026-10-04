import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption for channel credentials stored at rest.
// Payload format: `v1.<iv>.<tag>.<ciphertext>` (each part base64url).
// Key comes from CHANNEL_CREDENTIALS_KEY (64 hex chars = 32 bytes); read
// directly from process.env so this module stays usable in tests/scripts
// without a full ServerEnv. @crm/config validates the format at boot.
const VERSION = "v1";
const IV_BYTES = 12; // recommended nonce size for AES-256-GCM

function credentialsKey(): Buffer {
  const hex = process.env.CHANNEL_CREDENTIALS_KEY;
  if (!hex) {
    throw new Error(
      "CHANNEL_CREDENTIALS_KEY is not set — generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("CHANNEL_CREDENTIALS_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

/** Encrypts a JSON-serializable value; safe to store in a text column. */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", credentialsKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [
    VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/** Decrypts a payload produced by encryptJson. Throws on wrong key/tampering. */
export function decryptJson<T>(payload: string): T {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Unsupported encrypted payload format (expected v1.<iv>.<tag>.<ciphertext>)");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      credentialsKey(),
      Buffer.from(parts[1]!, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(parts[2]!, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(parts[3]!, "base64url")),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch (error) {
    throw new Error(
      `Failed to decrypt payload — wrong key or corrupted data (${(error as Error).message})`,
    );
  }
}
