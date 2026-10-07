import { z } from "zod";

// Credentials stored encrypted per connection — the shapes mirror the
// provider configs in @crm/channels. For WAHA they are built by the service
// from platform envs (baseUrl/apiKey) plus a generated per-connection HMAC
// key and a session name derived from the connection name — the client only
// supplies `name`. Meta credentials stay user-supplied (per-org apps).
export const wahaCredentialsSchema = z.object({
  baseUrl: z.url(),
  apiKey: z.string().min(1),
  webhookHmacKey: z.string().min(1),
  /** WAHA session name — URL-safe (it appears in WAHA API paths). */
  session: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, "Sessão: apenas letras, números, '-' e '_'")
    .min(1)
    .max(64),
});

export const metaCloudCredentialsSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  appSecret: z.string().min(1),
  verifyToken: z.string().min(1),
  graphApiVersion: z.string().min(1).optional(),
});

/** Blank or absent → treated as "use the platform default" at create time. */
const blankableString = z
  .string()
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/**
 * Connection-creation input: phoneNumberId/accessToken stay required (they
 * are per-org WABA values); app-level appSecret/verifyToken/graphApiVersion
 * may be omitted and are filled from platform_settings.meta — the merged
 * result must still satisfy metaCloudCredentialsSchema.
 */
export const metaCloudCredentialsInput = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  appSecret: blankableString,
  verifyToken: blankableString,
  graphApiVersion: blankableString,
});
export type MetaCloudCredentialsInput = z.input<typeof metaCloudCredentialsInput>;

export const channelCredentialsSchema = z.union([
  wahaCredentialsSchema,
  metaCloudCredentialsSchema,
]);

export type ChannelCredentials = z.infer<typeof channelCredentialsSchema>;

const connectionName = z.string().trim().min(1).max(120);

export const createChannelConnectionInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("waha"),
    name: connectionName,
  }),
  z.object({
    kind: z.literal("meta_cloud"),
    name: connectionName,
    credentials: metaCloudCredentialsInput,
  }),
  z.object({
    kind: z.literal("site_chat"),
    name: connectionName,
    credentials: z.object({}).optional(),
  }),
]);

export type CreateChannelConnectionInput = z.input<typeof createChannelConnectionInput>;

/** Widget config stored on a site_chat connection's metadata jsonb. */
export const widgetConfigSchema = z.object({
  welcomeText: z.string().max(200).optional(),
  accentColor: z.string().max(32).optional(),
  position: z.enum(["left", "right"]).optional(),
});
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
