import type { Database } from "@crm/db";

import { findUserPreferences, writeUserPreferences } from "./repository";
import type { UpdateUserPreferencesInput, UserPreferences } from "./schemas";
import { updateUserPreferencesInput, userPreferencesSchema } from "./schemas";

/**
 * Read the session user's preferences. Self-scoped by userId — no
 * TenantContext and no permission gate because this is never org data.
 */
export async function getUserPreferences(db: Database, userId: string): Promise<UserPreferences> {
  return userPreferencesSchema.parse(await findUserPreferences(db, userId));
}

/**
 * Merge-on-write: provided keys replace, absent keys keep. Unknown keys are
 * stripped by the schema — the column never grows unvalidated shapes.
 */
export async function setUserPreferences(
  db: Database,
  userId: string,
  input: UpdateUserPreferencesInput,
): Promise<UserPreferences> {
  const patch = updateUserPreferencesInput.parse(input);
  const current = await getUserPreferences(db, userId);
  const next = userPreferencesSchema.parse({ ...current, ...patch });
  await writeUserPreferences(db, userId, next);
  return next;
}
