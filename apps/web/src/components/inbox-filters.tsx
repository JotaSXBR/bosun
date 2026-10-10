"use client";

import { Input } from "@crm/design-system/components/input";
import { Select } from "@crm/design-system/components/select";
import { Switch } from "@crm/design-system/components/switch";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export interface FilterParams {
  view: string;
  c?: string;
  q?: string;
  conn?: string;
  sector?: string;
  awaiting?: string;
}

export function buildInboxQuery(params: FilterParams): string {
  const sp = new URLSearchParams();
  for (const key of ["view", "c", "q", "conn", "sector", "awaiting"] as const) {
    const value = params[key];
    if (value) sp.set(key, value);
  }
  return sp.toString();
}

/**
 * Filter bar of the queue column. Every control rewrites the query string —
 * the list re-renders server-side; selection (`c`) survives a filter change.
 */
export function InboxFilters({
  params,
  channels,
  sectors,
}: {
  params: FilterParams;
  channels: { id: string; name: string }[];
  sectors: { id: string; name: string }[];
}) {
  const t = useTranslations("inbox.filters");
  const router = useRouter();
  const [search, setSearch] = useState(params.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const replace = (patch: Partial<FilterParams>) =>
    router.replace(`/app/inbox?${buildInboxQuery({ ...params, ...patch })}`, { scroll: false });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onSearch = (value: string) => {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => replace({ q: value || undefined }), 350);
  };

  return (
    <div className="space-y-2 px-3 pt-3" data-testid="inbox-filters">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={t("search")}
        aria-label={t("search")}
      />
      <div className="flex items-center gap-2">
        {channels.length > 1 && (
          <Select
            options={[
              { value: "all", label: t("allChannels") },
              ...channels.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={params.conn ?? "all"}
            onChange={(v) => replace({ conn: v === "all" ? undefined : v })}
            aria-label={t("channel")}
            className="min-w-0 flex-1"
          />
        )}
        {sectors.length > 0 && (
          <Select
            options={[
              { value: "all", label: t("allSectors") },
              ...sectors.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={params.sector ?? "all"}
            onChange={(v) => replace({ sector: v === "all" ? undefined : v })}
            aria-label={t("sector")}
            className="min-w-0 flex-1"
          />
        )}
      </div>
      <div className="pb-1">
        <Switch
          checked={params.awaiting === "1"}
          onChange={(checked) => replace({ awaiting: checked ? "1" : undefined })}
          label={t("awaiting")}
          size="sm"
        />
      </div>
    </div>
  );
}
