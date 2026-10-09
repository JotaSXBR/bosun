import { isWhatsAppChatId } from "@crm/core/contacts";
import { Card } from "@crm/design-system/components/card";
import { Input } from "@crm/design-system/components/input";
import { EmptyState } from "@crm/design-system/templates/empty-state";
import { PageHeader } from "@crm/design-system/templates/page-header";
import { hasPermission } from "@crm/permissions";
import { getFormatter, getTranslations } from "next-intl/server";

import type { ContactListRow } from "@/server/services";
import { listContactsPage, listWahaConnections } from "@/server/services";
import { requireTenantContext } from "@/server/tenant";

import { ContactsHeaderActions, StartConversationButton } from "./contacts-actions";

// Reads the session + database → must never be prerendered at build time.
export const dynamic = "force-dynamic";

function contactEmail(metadata: ContactListRow["metadata"]): string | undefined {
  const email = (metadata as Record<string, unknown> | null)?.email;
  return typeof email === "string" ? email : undefined;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("contacts");
  const format = await getFormatter();
  const ctx = await requireTenantContext();
  const { q } = await searchParams;
  const query = q?.trim();
  const canWrite = hasPermission(ctx.role, { messaging: ["write"] });
  const [contacts, connections] = await Promise.all([
    listContactsPage(ctx, query),
    listWahaConnections(ctx),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={t("title")}
        right={canWrite ? <ContactsHeaderActions connections={connections} /> : undefined}
      />

      <form className="flex gap-2" role="search">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          icon="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className="flex-1"
        />
      </form>

      {contacts.length === 0 ? (
        <EmptyState icon="users" title={query ? t("emptySearch", { query }) : t("empty")} />
      ) : (
        <Card title={t("title")}>
          <ul className="divide-y" data-testid="contact-list">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-3">
                    <span className="truncate font-medium">
                      {contact.displayName ?? contact.channelUserId}
                    </span>
                    <span className="text-ink-muted shrink-0 text-xs">
                      {t("tickets", { count: contact.conversationCount })}
                    </span>
                  </div>
                  <p className="text-ink-muted truncate text-xs">
                    {contact.channelUserId}
                    {contactEmail(contact.metadata) && ` · ${contactEmail(contact.metadata)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <time className="text-ink-muted text-xs">
                    {format.dateTime(contact.createdAt, { dateStyle: "short" })}
                  </time>
                  {canWrite && isWhatsAppChatId(contact.channelUserId) && (
                    <StartConversationButton
                      connections={connections}
                      contact={{
                        id: contact.id,
                        label: contact.displayName ?? contact.channelUserId,
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
