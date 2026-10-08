"use client";

// Shared helper for the message islands: wraps a server action in a
// transition, toasts failures and refreshes the route on success.
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

export function useAction() {
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(result.error ?? t("actionFailed"));
        return;
      }
      router.refresh();
    });
  };
  return { pending, run };
}
