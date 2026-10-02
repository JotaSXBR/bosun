import type { Database } from "@crm/db";
import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";

const { organizationMembers, organizations } = schema;

// Better Auth tables have no RLS (auth runs before tenant context exists),
// so membership lookups are plain selects — authorization is the service's job.

export async function findMember(
  db: Database,
  userId: string,
  organizationId: string,
): Promise<{ role: string } | null> {
  const [row] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listMemberships(
  db: Database,
  userId: string,
): Promise<{ organizationId: string; organizationName: string; role: string }[]> {
  return db
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));
}
