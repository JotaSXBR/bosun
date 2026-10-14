"use client";

// Absolute timestamps must render in the user's timezone. Server-rendered
// `format.dateTime` uses the container's zone (UTC) — this island formats
// with the browser's Intl instead. SSR still emits UTC text, so the span
// carries suppressHydrationWarning for the one-frame swap on hydration.
import { useFormatter } from "next-intl";

type Style = "full" | "long" | "medium" | "short";

export function LocalDateTime({
  date,
  dateStyle = "short",
  timeStyle,
}: {
  date: Date | string;
  dateStyle?: Style;
  timeStyle?: Style;
}) {
  const format = useFormatter();
  const opts = timeStyle ? { dateStyle, timeStyle } : { dateStyle };
  return <span suppressHydrationWarning>{format.dateTime(new Date(date), opts)}</span>;
}
