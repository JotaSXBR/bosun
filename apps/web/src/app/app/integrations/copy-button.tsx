"use client";

import { Button } from "@crm/ui/components/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function CopyButton({ value }: { value: string }) {
  const t = useTranslations("integrations");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => toast.success(t("copy.copied")))
          .catch(() => toast.error(t("copy.failed")));
      }}
    >
      {t("copy.button")}
    </Button>
  );
}
