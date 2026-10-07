"use client";

import { Button } from "@crm/ui/components/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { NewFunnelDialog } from "@/components/funnel-dialogs";

/** Standalone trigger for the funnel-creation dialog (empty state). */
export function NewFunnelButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" /> Criar funil
      </Button>
      <NewFunnelDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
