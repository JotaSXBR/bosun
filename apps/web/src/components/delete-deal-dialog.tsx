"use client";

import type { DealCardRow } from "@crm/core/leads";
import { Button } from "@crm/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@crm/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteDealAction } from "@/server/actions/leads";

export function DeleteDealDialog({
  deal,
  open,
  onOpenChange,
}: {
  deal: DealCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dealForm.deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("dealForm.deleteConfirm", { title: deal.title })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteDealAction(deal.id, deal.conversationId ?? undefined);
                if (result.ok) {
                  toast.success(t("dealForm.deleted"));
                  onOpenChange(false);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            {t("dealForm.deleteTitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
