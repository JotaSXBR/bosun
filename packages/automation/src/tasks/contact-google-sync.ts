import { syncContactToGoogle } from "@crm/core/external-connections";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { z } from "zod";

export const contactGoogleSyncPayload = z.object({
  organizationId: z.uuid(),
  contactId: z.uuid(),
});

export type ContactGoogleSyncPayload = z.infer<typeof contactGoogleSyncPayload>;

/**
 * Mirrors one contact into the org's Google account. Always completes: the
 * queue is `key_strict_fifo`, so a failed job would hold the whole org's
 * key. Google errors are recorded on the contact by the sync itself.
 */
export async function contactGoogleSyncHandler(payload: unknown): Promise<{ ok: boolean }> {
  const parsed = contactGoogleSyncPayload.parse(payload);
  try {
    await syncContactToGoogle(getDb(), parsed);
    return { ok: true };
  } catch (error) {
    captureException(error, { job: "contact-google-sync", contactId: parsed.contactId });
    return { ok: false };
  }
}
