"use client";

import { Card } from "@crm/design-system/components/card";
import { Switch } from "@crm/design-system/components/switch";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updatePreferencesAction } from "@/server/actions/account";

type ToastKey = "drafts" | "nudges" | "suggestions";

interface Labels {
  title: string;
  hint: string;
  drafts: string;
  nudges: string;
  suggestions: string;
}

export function NotificationsForm({
  toasts,
  labels,
}: {
  toasts: Record<ToastKey, boolean>;
  labels: Labels;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(key: ToastKey, checked: boolean) {
    startTransition(async () => {
      const result = await updatePreferencesAction({
        toasts: { ...toasts, [key]: checked },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card title={labels.title} subtitle={labels.hint}>
      <div className="space-y-4">
        <Switch
          checked={toasts.drafts}
          disabled={isPending}
          onChange={(v) => toggle("drafts", v)}
          label={labels.drafts}
        />
        <Switch
          checked={toasts.nudges}
          disabled={isPending}
          onChange={(v) => toggle("nudges", v)}
          label={labels.nudges}
        />
        <Switch
          checked={toasts.suggestions}
          disabled={isPending}
          onChange={(v) => toggle("suggestions", v)}
          label={labels.suggestions}
        />
      </div>
    </Card>
  );
}
