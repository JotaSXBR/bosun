"use server";

import { getAuth } from "@crm/auth";
import { enqueueOrganizationOnboarding } from "@crm/automation";
import { recordAuditEvent } from "@crm/core/audit";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da organização").max(80),
});

export type CreateOrganizationResult = { ok: true } | { ok: false; error: string };

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "org";
}

export async function createOrganization(input: unknown): Promise<CreateOrganizationResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  try {
    const check = await auth.api.checkOrganizationSlug({
      body: { slug: baseSlug },
      headers: requestHeaders,
    });
    // check returns { status: boolean } — true when the slug is available.
    if (!check.status) {
      slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    }
  } catch (error) {
    captureException(error, { action: "organization.create.checkSlug" });
    return { ok: false, error: "Não foi possível criar a organização." };
  }

  let org: { id: string };
  try {
    org = await auth.api.createOrganization({
      body: { name: parsed.data.name, slug },
      headers: requestHeaders,
    });
  } catch (error) {
    captureException(error, { action: "organization.create" });
    return { ok: false, error: "Não foi possível criar a organização." };
  }

  await auth.api.setActiveOrganization({
    body: { organizationId: org.id },
    headers: requestHeaders,
  });

  await recordAuditEvent(
    getDb(),
    {
      organizationId: org.id,
      userId: session.user.id,
      role: "owner",
      isPlatformAdmin: session.user.role === "platform_admin",
    },
    { action: "organization.created", targetType: "organization", targetId: org.id },
  );

  // Background onboarding must never break organization creation.
  try {
    await enqueueOrganizationOnboarding({
      organizationId: org.id,
      actorUserId: session.user.id,
    });
  } catch (error) {
    captureException(error, { action: "organization.enqueueOnboarding" });
  }

  redirect("/app");
}
