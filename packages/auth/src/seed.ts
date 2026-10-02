// Dev seed: platform admin + "Demo" org with one user per role.
// Idempotent: existing rows are reused. Refuses to run in production.
import { getServerEnv } from "@crm/config";
import { createDb, schema } from "@crm/db";
import { eq } from "drizzle-orm";

import { createAuth } from "./auth";

const PASSWORD = "Password123!";

const DEMO_ORG = { name: "Demo", slug: "demo" };
const USERS = [
  { email: "owner@crm.local", name: "Owner Demo", orgRole: "owner" },
  { email: "admin@crm.local", name: "Admin Demo", orgRole: "admin" },
  { email: "manager@crm.local", name: "Manager Demo", orgRole: "manager" },
  { email: "agent@crm.local", name: "Agent Demo", orgRole: "agent" },
] as const;

const PLATFORM_ADMIN = { email: "superadmin@crm.local", name: "Platform Admin" };

async function main() {
  const env = getServerEnv();
  if (env.nodeEnv === "production") {
    throw new Error("db:seed refuses to run when NODE_ENV=production");
  }

  const db = createDb(env.database.adminUrl ?? env.database.url);
  const auth = createAuth({ db, env });

  const ensureUser = async (email: string, name: string): Promise<string> => {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (existing[0]) return existing[0].id;

    const result = await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name },
    });
    return result.user.id;
  };

  // Platform admin (users.role drives the better-auth admin plugin).
  const platformAdminId = await ensureUser(PLATFORM_ADMIN.email, PLATFORM_ADMIN.name);
  await db
    .update(schema.users)
    .set({ role: "platform_admin" })
    .where(eq(schema.users.id, platformAdminId));

  // Demo organization.
  let org = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, DEMO_ORG.slug))
    .limit(1)
    .then((rows) => rows[0]);
  if (!org) {
    const [created] = await db
      .insert(schema.organizations)
      .values({ name: DEMO_ORG.name, slug: DEMO_ORG.slug })
      .returning({ id: schema.organizations.id });
    org = created;
  }
  if (!org) throw new Error("failed to create demo organization");

  for (const user of USERS) {
    const userId = await ensureUser(user.email, user.name);
    await db
      .insert(schema.organizationMembers)
      .values({ organizationId: org.id, userId, role: user.orgRole })
      .onConflictDoNothing();
  }

  await db.$client.end();

  console.log("Seed complete:");
  console.log(`  platform admin: ${PLATFORM_ADMIN.email} / ${PASSWORD}`);
  console.log(`  demo org "${DEMO_ORG.name}" (slug: ${DEMO_ORG.slug}):`);
  for (const user of USERS) {
    console.log(`    ${user.orgRole.padEnd(8)} ${user.email} / ${PASSWORD}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
