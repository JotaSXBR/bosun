"use client";

import { Button } from "@crm/ui/components/button";
import { toast } from "@crm/ui/components/toast";
import { useTranslations } from "next-intl";

export function CopyButton({ value }: { value: string }) {
  const t = useTranslations("integrations");
  return (
    <Button
      type="button"
      variant="secondary"
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
