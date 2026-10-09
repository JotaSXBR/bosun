"use client";

import { Button } from "@crm/ui/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { NewFunnelDialog } from "@/components/funnel-dialogs";

/** Standalone trigger for the funnel-creation dialog (empty state). */
export function NewFunnelButton() {
  const t = useTranslations("leads");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" iconLeft="plus" onClick={() => setOpen(true)}>
        {t("createFunnel")}
      </Button>
      <NewFunnelDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
