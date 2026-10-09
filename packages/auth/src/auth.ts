import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { ServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { schema } from "@crm/db";
import { createLogger } from "@crm/observability";
import { ac, roles } from "@crm/permissions";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { adminAc, defaultRoles } from "better-auth/plugins/admin/access";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type AuthOptions = {
  db: Database;
  env: ServerEnv;
  /**
   * Outbound email hook (verification, password reset). Until @crm/email
   * exists the default just logs — real wiring lands with that package.
   */
  sendEmail?: ((message: EmailMessage) => Promise<void>) | undefined;
};

const defaultSendEmailLogger = createLogger({ bindings: { component: "auth:email" } });

const defaultSendEmail = (message: EmailMessage): Promise<void> => {
  defaultSendEmailLogger.info("sending auth email (default hook)", {
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  return Promise.resolve();
};

export function createAuth({ db, env, sendEmail = defaultSendEmail }: AuthOptions) {
  return betterAuth({
    appName: "CRM",
    secret: env.auth.secret,
    baseURL: env.appUrl,
    trustedOrigins: [env.appUrl],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        organizations: schema.organizations,
        organization_members: schema.organizationMembers,
        organization_invitations: schema.organizationInvitations,
      },
    }),
    user: { modelName: "users" },
    session: { modelName: "sessions" },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    advanced: {
      database: { generateId: "uuid" },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: env.nodeEnv === "production",
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Redefinição de senha",
          text: `Use este link para redefinir sua senha: ${url}`,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Verifique seu e-mail",
          text: `Use este link para verificar seu e-mail: ${url}`,
        });
      },
    },
    rateLimit: { enabled: env.nodeEnv === "production" },
    plugins: [
      organization({
        ac,
        roles,
        allowUserToCreateOrganization: true,
        creatorRole: "owner",
        schema: {
          organization: { modelName: "organizations" },
          member: { modelName: "organization_members" },
          invitation: { modelName: "organization_invitations" },
        },
      }),
      // platform_admin gets the full built-in admin permission set.
      admin({
        adminRoles: ["platform_admin"],
        roles: { ...defaultRoles, platform_admin: adminAc },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
