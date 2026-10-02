import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Constant-time HMAC check of a hex-encoded signature over a payload.
 * Returns false on any mismatch or malformed input — never throws.
 */
export function verifyHmacSignature(args: {
  algorithm: "sha256" | "sha512";
  secret: string;
  payload: string | Buffer;
  signatureHex: string;
}): boolean {
  let expected: Buffer;
  let received: Buffer;
  try {
    expected = createHmac(args.algorithm, args.secret).update(args.payload).digest();
    received = Buffer.from(args.signatureHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
