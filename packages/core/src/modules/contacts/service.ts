import type { Database } from "@crm/db";
import { withTenant } from "@crm/db";

import { NotFoundError } from "../../errors";
import type { TenantContext } from "../../tenant/context";
import { assertPermission } from "../../tenant/context";
import { normalizeWhatsAppChatId } from "./phone";
import type { ContactListRow, ContactRow } from "./repository";
import { findContactById, insertOrGetContact, listContacts } from "./repository";
import type { CreateContactInput, ListContactsInput } from "./schemas";
import { createContactInput, listContactsInput } from "./schemas";

/**
 * Requires messaging:write. Creates a contact manually — today the only
 * manual identity is a WhatsApp phone (international digits, normalized to
 * `<ddi+number>@c.us`). Dedup is per (org, channelUserId): re-creating the
 * same number returns the existing contact and refreshes its name. Email
 * is stored in `metadata` (same convention as site_chat contacts).
 */
export async function createContact(
  db: Database,
  ctx: TenantContext,
  input: CreateContactInput,
): Promise<ContactRow> {
  assertPermission(ctx, { messaging: ["write"] });
  const parsed = createContactInput.parse(input);
  const channelUserId = normalizeWhatsAppChatId(parsed.phone);
  return withTenant(db, ctx.organizationId, (tx) =>
    insertOrGetContact(tx, ctx.organizationId, {
      channelUserId,
      displayName: parsed.displayName,
      metadata: {
        source: "manual",
        ...(parsed.email ? { email: parsed.email.toLowerCase() } : {}),
      },
    }),
  );
}

/** Requires messaging:read (every member, viewer included). */
export async function listOrgContacts(
  db: Database,
  ctx: TenantContext,
  input: ListContactsInput,
): Promise<ContactListRow[]> {
  assertPermission(ctx, { messaging: ["read"] });
  const parsed = listContactsInput.parse(input);
  return withTenant(db, ctx.organizationId, (tx) => listContacts(tx, ctx.organizationId, parsed));
}

/** Requires messaging:read. */
export async function getContact(
  db: Database,
  ctx: TenantContext,
  contactId: string,
): Promise<ContactRow> {
  assertPermission(ctx, { messaging: ["read"] });
  const contact = await withTenant(db, ctx.organizationId, (tx) => findContactById(tx, contactId));
  if (!contact) throw new NotFoundError("Contact", contactId);
  return contact;
}
