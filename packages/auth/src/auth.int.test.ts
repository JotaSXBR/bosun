// Integration test — requires Postgres with migrations applied.
// Run: pnpm infra:up && pnpm db:migrate && pnpm test:integration
import { getServerEnv } from "@crm/config";
import type { Database } from "@crm/db";
import { createDb, schema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Auth } from "./auth";
import { createAuth } from "./auth";

const { organizationMembers, organizations, users } = schema;

let db: Database;
let auth: Auth;
const suffix = crypto.randomUUID().slice(0, 8);
const email = `it-auth-${suffix}@crm.local`;
const password = "Password123!";
const orgSlug = `it-auth-${suffix}`;

beforeAll(async () => {
  const env = getServerEnv();
  db = createDb(env.database.url);
  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    throw new Error(
      "Integration tests require a migrated database. Run `pnpm infra:up && pnpm db:migrate` first.",
      { cause: error },
    );
  }
  auth = createAuth({ db, env });
});

afterAll(async () => {
  await db.delete(organizations).where(eq(organizations.slug, orgSlug));
  await db.delete(users).where(eq(users.email, email));
  await db.$client.end();
});

describe("better-auth flow", () => {
  it("signs up, creates an org (member role owner), and signs in", async () => {
    const signUp = await auth.api.signUpEmail({
      body: { email, password, name: "IT Auth" },
      returnHeaders: true,
    });
    expect(signUp.response.user.email).toBe(email);
    const userId = signUp.response.user.id;

    // auth.api reads the `cookie` request header; the sign-up response carries
    // `set-cookie`, so convert it.
    const setCookie = signUp.headers.get("set-cookie") ?? "";
    const sessionHeaders = new Headers({ cookie: setCookie.split(";")[0]! });

    const org = await auth.api.createOrganization({
      body: { name: "IT Auth Org", slug: orgSlug },
      headers: sessionHeaders,
    });
    expect(org.slug).toBe(orgSlug);

    const member = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(eq(organizationMembers.organizationId, org.id), eq(organizationMembers.userId, userId)),
      )
      .limit(1);
    expect(member[0]?.role).toBe("owner");

    const signIn = await auth.api.signInEmail({ body: { email, password } });
    expect(signIn.user.id).toBe(userId);
  });
});
