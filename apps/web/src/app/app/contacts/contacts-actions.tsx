"use client";

import { Button } from "@crm/design-system/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { NewContactDialog, NewConversationDialog } from "@/components/contact-dialogs";
import type { WahaConnectionPick } from "@/server/services";

/** Page-header actions for /app/contacts: nova conversa + novo contato. */
export function ContactsHeaderActions({ connections }: { connections: WahaConnectionPick[] }) {
  const t = useTranslations("contacts");
  const [convOpen, setConvOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        iconLeft="message-square"
        onClick={() => setConvOpen(true)}
      >
        {t("newConversation")}
      </Button>
      <Button variant="primary" size="sm" iconLeft="plus" onClick={() => setContactOpen(true)}>
        {t("newContact")}
      </Button>
      <NewConversationDialog open={convOpen} onOpenChange={setConvOpen} connections={connections} />
      <NewContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}

/** Per-row shortcut: opens the new-conversation dialog with the contact locked. */
export function StartConversationButton({
  connections,
  contact,
}: {
  connections: WahaConnectionPick[];
  contact: { id: string; label: string };
}) {
  const t = useTranslations("contacts");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" iconLeft="message-square" onClick={() => setOpen(true)}>
        {t("newConversation")}
      </Button>
      <NewConversationDialog
        open={open}
        onOpenChange={setOpen}
        connections={connections}
        contact={contact}
      />
    </>
  );
}
