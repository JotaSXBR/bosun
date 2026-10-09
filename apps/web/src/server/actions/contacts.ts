"use server";

import { DomainError } from "@crm/core";
import type { CreateContactInput } from "@crm/core/contacts";
import { createContact } from "@crm/core/contacts";
import type { StartOutboundConversationInput } from "@crm/core/messaging";
import { startOutboundConversation } from "@crm/core/messaging";
import { getDb } from "@crm/db";
import { captureException } from "@crm/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTenantContext } from "@/server/tenant";

export type ContactsActionResult = { ok: true; id: string } | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof DomainError) {
    return error.message;
  }
  captureException(error, { action: "contacts" });
  return fallback;
}

export async function createContactAction(
  input: CreateContactInput,
): Promise<ContactsActionResult> {
  const ctx = await requireTenantContext();
  try {
    const contact = await createContact(getDb(), ctx, input);
    revalidatePath("/app/contacts");
    return { ok: true, id: contact.id };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível criar o contato.") };
  }
}

export async function startOutboundConversationAction(
  input: StartOutboundConversationInput,
): Promise<ContactsActionResult> {
  const ctx = await requireTenantContext();
  try {
    const { conversation } = await startOutboundConversation(getDb(), ctx, input);
    revalidatePath("/app/inbox");
    revalidatePath("/app/contacts");
    return { ok: true, id: conversation.id };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Não foi possível abrir a conversa.") };
  }
}
