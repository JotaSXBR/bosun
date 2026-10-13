import type { Database } from "@crm/db";
import { schema } from "@crm/db";
import { eq } from "drizzle-orm";

const { users } = schema;

// users is a Better Auth table — no RLS; preferences are self-scoped by userId.

export async function findUserPreferences(
  db: Database,
  userId: string,
): Promise<Record<string, unknown>> {
  const [row] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.preferences ?? {};
}

export async function writeUserPreferences(
  db: Database,
  userId: string,
  preferences: Record<string, unknown>,
): Promise<void> {
  await db.update(users).set({ preferences }).where(eq(users.id, userId));
}
