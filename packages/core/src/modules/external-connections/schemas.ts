import { z } from "zod";

/** What `external_connections.bundle_encrypted` decrypts to for provider `google`. */
export const googleBundleSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  /** Anti-CSRF nonce of an in-flight consent; cleared once consumed. */
  state: z.object({ nonce: z.string(), issuedAt: z.number() }).optional(),
  tokens: z
    .object({ accessToken: z.string(), refreshToken: z.string(), expiresAt: z.string() })
    .optional(),
});
export type GoogleBundle = z.infer<typeof googleBundleSchema>;

export const saveGoogleClientInput = z.object({
  clientId: z.string().trim().min(1).max(300),
  clientSecret: z.string().trim().min(1).max(300),
  redirectUri: z.url(),
});
export type SaveGoogleClientInput = z.input<typeof saveGoogleClientInput>;

export const completeGoogleAuthorizationInput = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(256),
  redirectUri: z.url(),
});
export type CompleteGoogleAuthorizationInput = z.input<typeof completeGoogleAuthorizationInput>;
