"use client";

import { Card } from "@crm/design-system/components/card";
import { Select } from "@crm/design-system/components/select";
import { Switch } from "@crm/design-system/components/switch";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { updatePreferencesAction } from "@/server/actions/account";

interface Labels {
  theme: string;
  themeHint: string;
  dark: string;
  light: string;
  sendSeen: string;
  sendSeenHint: string;
}

export function PreferencesForm({
  theme,
  sendSeen,
  labels,
}: {
  theme: "light" | "dark";
  sendSeen: boolean;
  labels: Labels;
}) {
  const t = useTranslations("account.preferences");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(patch: { theme?: "light" | "dark"; sendSeen?: boolean }) {
    startTransition(async () => {
      const result = await updatePreferencesAction(patch);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // data-theme lives on <html> — swap it now, cookie+pref are persisted.
      if (patch.theme) document.documentElement.dataset.theme = patch.theme;
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card title={labels.theme} subtitle={labels.themeHint}>
        <Select
          value={theme}
          disabled={isPending}
          aria-label={t("theme")}
          options={[
            { value: "dark", label: labels.dark },
            { value: "light", label: labels.light },
          ]}
          onChange={(value) => save({ theme: value as "light" | "dark" })}
        />
      </Card>
      <Card title={t("messaging")}>
        <Switch
          checked={sendSeen}
          disabled={isPending}
          onChange={(checked) => save({ sendSeen: checked })}
          label={labels.sendSeen}
          description={labels.sendSeenHint}
        />
      </Card>
    </div>
  );
}
