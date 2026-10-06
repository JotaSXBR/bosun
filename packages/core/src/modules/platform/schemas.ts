import { z } from "zod";

/**
 * Stored shapes per platform_settings.key. Each mirrors the matching slice of
 * ServerEnv so consumers can swap `env.email` → `resolved.email` unchanged.
 * Every field is optional at rest: a row may carry only the keys the admin
 * actually set — the resolver fills the rest from env.
 */
export const emailSettingsSchema = z.object({
  provider: z.enum(["console", "resend", "smtp"]).optional(),
  from: z.string().optional(),
  resendApiKey: z.string().optional(),
  smtp: z
    .object({
      host: z.string().optional(),
      port: z.number().int().optional(),
      user: z.string().optional(),
      password: z.string().optional(),
      secure: z.boolean().optional(),
    })
    .optional(),
});
export type EmailSettings = z.infer<typeof emailSettingsSchema>;

export const billingSettingsSchema = z.object({
  asaasApiKey: z.string().optional(),
  asaasEnvironment: z.enum(["sandbox", "production"]).optional(),
  asaasWebhookToken: z.string().optional(),
});
export type BillingSettings = z.infer<typeof billingSettingsSchema>;

export const metaSettingsSchema = z.object({
  appSecret: z.string().optional(),
  verifyToken: z.string().optional(),
  accessToken: z.string().optional(),
  phoneNumberId: z.string().optional(),
  graphApiVersion: z.string().optional(),
});
export type MetaSettings = z.infer<typeof metaSettingsSchema>;

export const aiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
});
export type AiSettings = z.infer<typeof aiSettingsSchema>;

export const platformSettingGroupSchema = z.enum(["email", "billing", "meta", "ai"]);
export type PlatformSettingGroup = z.infer<typeof platformSettingGroupSchema>;

export const platformSettingValueSchemas = {
  email: emailSettingsSchema,
  billing: billingSettingsSchema,
  meta: metaSettingsSchema,
  ai: aiSettingsSchema,
} as const;

/**
 * Secret fields per group (dot paths into the group object). Never returned
 * to clients — summaries expose only whether a value is set, and an empty
 * input on update preserves the stored secret.
 */
export const platformSecretFields: Record<PlatformSettingGroup, readonly string[]> = {
  email: ["resendApiKey", "smtp.password"],
  billing: ["asaasApiKey", "asaasWebhookToken"],
  meta: ["appSecret", "verifyToken", "accessToken"],
  ai: ["openaiApiKey", "anthropicApiKey"],
};
