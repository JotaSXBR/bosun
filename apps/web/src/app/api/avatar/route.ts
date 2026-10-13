import { captureException } from "@crm/observability";
import { userAvatarKey } from "@crm/storage";
import { headers } from "next/headers";

import { getAuth } from "@/server/auth";
import { getStorage } from "@/server/storage";
import { getSession } from "@/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function badRequest(error: string): Response {
  return Response.json({ ok: false, error }, { status: 400 });
}

async function uploadAvatar(userId: string, file: File): Promise<void> {
  await getStorage().upload({
    key: userAvatarKey(userId),
    body: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
  });
  await getAuth().api.updateUser({
    headers: await headers(),
    body: { image: `/api/avatar/${userId}` },
  });
}

/**
 * POST /api/avatar — multipart upload of the caller's profile photo. Stored
 * under a user-scoped key (avatars follow the person, not the org) and
 * published as /api/avatar/<userId> on the user's image field.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const file = (await request.formData()).get("file");
  const invalid =
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_BYTES ||
    !ALLOWED_TYPES.has(file.type);
  if (invalid) return badRequest("invalid_file");

  try {
    await uploadAvatar(session.user.id, file);
    return Response.json({ ok: true });
  } catch (error) {
    captureException(error, { route: "api.avatar" });
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
