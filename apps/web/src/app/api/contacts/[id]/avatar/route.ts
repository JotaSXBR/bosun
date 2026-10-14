import { AuthorizationError, DomainError, NotFoundError } from "@crm/core";
import { getContact } from "@crm/core/contacts";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";

import { mediaResponse } from "@/lib/media-response";
import { getStorage } from "@/server/storage";
import { getTenantContext } from "@/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_TAG = "api.contact-avatar";

/**
 * Authenticated contact-avatar proxy. Bytes live in object storage under a
 * tenant key (`metadata.avatarKey`); `avatarUrl` is only the pointer to
 * this route. 404 when the contact has no stored photo.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const tenant = await getTenantContext();
  if (!tenant) {
    return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const contact = await getContact(getDb(), tenant, id);
    const avatarKey = contact.metadata.avatarKey;
    if (typeof avatarKey !== "string" || avatarKey.length === 0) {
      return Response.json({ ok: false }, { status: 404 });
    }
    const object = await getStorage().download(avatarKey);
    return mediaResponse(object.body, object.contentType, undefined);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ ok: false }, { status: 404 });
    }
    if (error instanceof AuthorizationError) {
      return Response.json({ ok: false }, { status: 403 });
    }
    if (error instanceof DomainError) {
      return Response.json({ ok: false, error: error.code }, { status: 400 });
    }
    captureException(error, { route: ROUTE_TAG });
    return Response.json({ ok: false }, { status: 500 });
  }
}
