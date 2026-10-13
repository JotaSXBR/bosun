import { AuthorizationError, type TenantContext } from "@crm/core";
import { listOrgMembers } from "@crm/core/organizations";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { StorageObjectNotFoundError, userAvatarKey } from "@crm/storage";

import { getStorage } from "@/server/storage";
import { getTenantContext } from "@/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Self or same-active-org member — the avatar's read gate. */
async function assertAvatarReadable(tenant: TenantContext, userId: string): Promise<void> {
  if (userId === tenant.userId) return;
  const sharedOrg = (await listOrgMembers(getDb(), tenant)).some((m) => m.userId === userId);
  if (!sharedOrg) throw new AuthorizationError();
}

function avatarErrorResponse(error: unknown): Response {
  if (error instanceof AuthorizationError) return Response.json({ ok: false }, { status: 403 });
  if (error instanceof StorageObjectNotFoundError) {
    return Response.json({ ok: false }, { status: 404 });
  }
  captureException(error, { route: "api.avatar" });
  return Response.json({ ok: false }, { status: 500 });
}

function avatarResponse(body: Uint8Array, contentType?: string): Response {
  return new Response(Buffer.from(body), {
    headers: {
      "content-type": contentType ?? "image/png",
      "cache-control": "private, max-age=300",
    },
  });
}

/**
 * GET /api/avatar/<userId> — same-org-or-self read. The avatar object key is
 * user-scoped; the read gate is "caller and target share the active org"
 * (or the caller IS the target, for org-less states).
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const { userId } = await ctx.params;
  if (!UUID_RE.test(userId)) return Response.json({ ok: false }, { status: 404 });
  const tenant = await getTenantContext();
  if (!tenant) return Response.json({ ok: false }, { status: 401 });

  try {
    await assertAvatarReadable(tenant, userId);
    const object = await getStorage().download(userAvatarKey(userId));
    return avatarResponse(object.body, object.contentType);
  } catch (error) {
    return avatarErrorResponse(error);
  }
}
