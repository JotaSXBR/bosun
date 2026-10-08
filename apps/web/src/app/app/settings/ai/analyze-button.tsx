"use client";

import { Button } from "@crm/ui/components/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { analyzeNowAction } from "@/server/actions/ai";

/** Manual observer trigger — analyzes the most recent resolved conversation. */
export function AnalyzeButton({ canManage }: { canManage: boolean }) {
  const t = useTranslations("settings.ai");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canManage) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await analyzeNowAction();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(t("analyzeStarted"));
          router.refresh();
        })
      }
    >
      {t("analyzeNow")}
    </Button>
  );
}
