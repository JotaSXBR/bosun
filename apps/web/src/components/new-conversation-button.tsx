"use client";

import { Button } from "@crm/design-system/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { NewConversationDialog } from "@/components/contact-dialogs";
import type { WahaConnectionPick } from "@/server/services";

/** Inbox header action — pick contact + WAHA connection, open the ticket. */
export function NewConversationButton({ connections }: { connections: WahaConnectionPick[] }) {
  const t = useTranslations("contacts");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" iconLeft="plus" onClick={() => setOpen(true)}>
        {t("newConversation")}
      </Button>
      <NewConversationDialog open={open} onOpenChange={setOpen} connections={connections} />
    </>
  );
}
