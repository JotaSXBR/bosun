"use client";

import { Badge } from "@crm/design-system/components/badge";
import { cn } from "@crm/design-system/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

/** Serialized row — preformatted server-side, no Dates cross the boundary. */
export interface QueueRowView {
  id: string;
  title: string;
  ticketNumber: number;
  preview: string | null;
  timeLabel: string;
  statusLabel: string | null;
  statusTone: "warning" | "success" | "neutral";
  /** Section header rendered when this value changes between rows (Fila). */
  sectionLabel: string | null;
  sectorName: string | null;
  assigneeName: string | null;
  channelName: string | null;
  awaitingReply: boolean;
  snoozedLabel: string | null;
}

function QueueRowItem({
  row,
  href,
  selected,
  cursor,
  showAssignee,
  showChannel,
  awaitingLabel,
}: {
  row: QueueRowView;
  href: string;
  selected: boolean;
  cursor: boolean;
  showAssignee: boolean;
  showChannel: boolean;
  awaitingLabel: string;
}) {
  return (
    <Link
      href={href}
      data-selected={selected || undefined}
      className={cn(
        "hover:bg-raised/50 block space-y-1 px-3 py-3 transition-colors",
        selected && "bg-raised/60",
        cursor && "shadow-focus",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {row.awaitingReply && (
            <span className="bg-signal h-2 w-2 shrink-0 rounded-full" title={awaitingLabel} />
          )}
          <span className="truncate font-medium">{row.title}</span>
          <span className="text-ink-muted shrink-0 text-xs">#{row.ticketNumber}</span>
        </span>
        <span className="text-ink-muted shrink-0 text-xs">{row.timeLabel}</span>
      </div>
      {row.preview && <p className="text-ink-muted truncate text-sm">{row.preview}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {row.statusLabel && <Badge tone={row.statusTone}>{row.statusLabel}</Badge>}
        {[
          row.sectorName,
          showChannel ? row.channelName : null,
          showAssignee ? row.assigneeName : null,
        ]
          .filter((v): v is string => v !== null)
          .map((label) => (
            <span
              key={label}
              className="border-line text-ink-muted rounded-md border px-1.5 py-0.5 text-xs"
            >
              {label}
            </span>
          ))}
        {row.snoozedLabel && <span className="text-ink-muted text-xs">{row.snoozedLabel}</span>}
      </div>
    </Link>
  );
}

export function InboxQueueList({
  rows,
  selectedId,
  query,
  showAssignee,
  showChannel,
}: {
  rows: QueueRowView[];
  selectedId: string | undefined;
  /** Query string preserving the active filters — selection joins as `c`. */
  query: string;
  showAssignee: boolean;
  showChannel: boolean;
}) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [cursor, setCursor] = useState(() =>
    Math.max(
      0,
      rows.findIndex((r) => r.id === selectedId),
    ),
  );
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key !== "j" && event.key !== "k" && event.key !== "Enter") return;
      event.preventDefault();
      setCursor((current) => {
        if (event.key === "Enter") {
          const id = ids[current];
          if (id) router.push(`/app/inbox?${query}&c=${id}`);
          return current;
        }
        const next = current + (event.key === "j" ? 1 : -1);
        return Math.min(ids.length - 1, Math.max(0, next));
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, query, router]);

  return (
    <ul className="divide-line divide-y" data-testid="conversation-list">
      {rows.map((row, index) => (
        <li key={row.id}>
          {row.sectionLabel && (
            <div className="bg-raised/40 text-ink-muted px-3 py-1.5 text-xs font-medium uppercase">
              {row.sectionLabel}
            </div>
          )}
          <QueueRowItem
            row={row}
            href={`/app/inbox?${query}&c=${row.id}`}
            selected={row.id === selectedId}
            cursor={index === cursor}
            showAssignee={showAssignee}
            showChannel={showChannel}
            awaitingLabel={t("awaitingReply")}
          />
        </li>
      ))}
    </ul>
  );
}
