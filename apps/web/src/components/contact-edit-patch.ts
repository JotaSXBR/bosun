import type { UpdateContactProfileInput } from "@crm/core/contacts";

const KEYS = [
  "displayName",
  "email",
  "phone",
  "company",
  "jobTitle",
  "birthday",
  "address",
  "urls",
  "notes",
] as const;

export type ProfileForm = Record<(typeof KEYS)[number], string>;

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Only what the user changed, trimmed (`""` clears a field; `urls` is one per
 * line). Sending the whole form would overwrite concurrent edits and would
 * make a contact without a name impossible to save (the name is required).
 */
export function changedProfileFields(
  initial: ProfileForm,
  current: ProfileForm,
): Omit<UpdateContactProfileInput, "contactId"> {
  const patch: Record<string, string | string[]> = {};
  for (const key of KEYS) {
    if (key === "urls") {
      const next = lines(current.urls);
      if (lines(initial.urls).join("\n") !== next.join("\n")) patch.urls = next;
    } else if (initial[key].trim() !== current[key].trim()) {
      patch[key] = current[key].trim();
    }
  }
  return patch;
}
