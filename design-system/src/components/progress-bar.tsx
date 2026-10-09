import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

const HEIGHTS = { sm: 6, md: 12, lg: 26 } as const;

const TONES = {
  accent: "bg-data-1",
  mist: "bg-data-2",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
} as const;

/** Progress track: solid fill = done, hatched remainder = still planned. */
export interface ProgressBarProps extends React.ComponentProps<"div"> {
  value: number;
  /** @default 100 */
  max?: number;
  /** sm 6 / md 12 / lg 26 px, or a px number. @default "md" */
  size?: keyof typeof HEIGHTS | number;
  /** @default "accent" */
  tone?: keyof typeof TONES;
  /** Hatch the remaining track. @default true */
  pattern?: boolean;
  /** Glowing knob at the fill edge (hero metrics only). */
  thumb?: boolean;
  /** Evenly spaced axis labels below (e.g. weekdays). */
  labels?: string[];
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
}

function Header({ label, valueLabel }: { label?: React.ReactNode; valueLabel?: React.ReactNode }) {
  if (label == null && valueLabel == null) return null;
  return (
    <div className="text-ui flex justify-between gap-3">
      <span className="text-ink">{label}</span>
      <span className="text-ink-muted tabular-nums">{valueLabel}</span>
    </div>
  );
}

function Thumb({ pct, h }: { pct: number; h: number }) {
  return (
    <div
      className="bg-raised shadow-glow duration-chart ease-standard absolute top-1/2 flex -translate-x-3/5 -translate-y-1/2 items-center justify-center rounded-full transition-[left]"
      style={{ left: `${pct}%`, width: h + 12, height: h + 12 }}
    >
      <span className="flex flex-col gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="bg-mist size-0.5 rounded-full" />
        ))}
      </span>
    </div>
  );
}

export function ProgressBar({
  value = 0,
  max = 100,
  size = "md",
  tone = "accent",
  pattern = true,
  thumb = false,
  labels,
  label,
  valueLabel,
  className,
  ref,
  ...props
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const h = typeof size === "number" ? size : HEIGHTS[size];
  return (
    <div ref={ref} className={cn("flex min-w-0 flex-col gap-2.5", className)} {...props}>
      <Header label={label} valueLabel={valueLabel} />
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn("rounded-pill bg-data-track relative", pattern && "bx-hatch")}
        style={{ height: h }}
      >
        <div
          className={cn(
            "rounded-pill duration-chart ease-standard absolute top-0 bottom-0 left-0 transition-[width]",
            TONES[tone],
          )}
          style={{ width: `${pct}%`, minWidth: pct > 0 ? h : 0 }}
        />
        {thumb && <Thumb pct={pct} h={h} />}
      </div>
      {labels && (
        <div className="text-ink-subtle flex justify-between text-xs">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
