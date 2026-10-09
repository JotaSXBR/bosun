"use client";

import type { DealCardRow } from "@crm/core/leads";
import { Button } from "@crm/design-system/components/button";
import { Dialog } from "@crm/design-system/components/dialog";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("dealForm.deleteTitle")}
      description={t("dealForm.deleteConfirm", { title: deal.title })}
      footer={
        <Button
          variant="danger"
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
      }
    ></Dialog>
  );
}
