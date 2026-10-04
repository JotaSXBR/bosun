import { z } from "zod";

// Credentials stored encrypted per connection — the shapes mirror the
// provider configs in @crm/channels (WAHA session optional, defaults to
// "default"; Meta graphApiVersion optional, the adapter defaults it).
export const wahaCredentialsSchema = z.object({
  baseUrl: z.url(),
  apiKey: z.string().min(1),
  webhookHmacKey: z.string().min(1),
  session: z.string().min(1).optional(),
});

export const metaCloudCredentialsSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  appSecret: z.string().min(1),
  verifyToken: z.string().min(1),
  graphApiVersion: z.string().min(1).optional(),
});

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
    credentials: wahaCredentialsSchema,
  }),
  z.object({
    kind: z.literal("meta_cloud"),
    name: connectionName,
    credentials: metaCloudCredentialsSchema,
  }),
]);

export type CreateChannelConnectionInput = z.input<typeof createChannelConnectionInput>;
