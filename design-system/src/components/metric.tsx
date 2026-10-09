import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

import { Badge } from "./badge";
import type { IconName } from "./icon";

const SIZES = { sm: "text-metric-sm", md: "text-metric", lg: "text-metric-xl" } as const;

/** Large figure in light Manrope with optional unit, label and delta badge. */
export interface MetricProps extends Omit<React.ComponentProps<"div">, "prefix"> {
  value: React.ReactNode;
  /** Small raised unit before the value (e.g. "R$"). */
  prefix?: React.ReactNode;
  /** Small unit after (e.g. "%", "h"). */
  suffix?: React.ReactNode;
  label?: React.ReactNode;
  /** Delta text shown in a Badge, e.g. "18% esta semana". */
  delta?: React.ReactNode;
  /** @default "success" */
  deltaTone?: "success" | "warning" | "danger" | "neutral" | "accent";
  /** @default "arrow-up-right" */
  deltaIcon?: IconName;
  /** sm 32 / md 48 / lg 64 px. @default "md" */
  size?: keyof typeof SIZES;
  /** Use inside an accent card. */
  onAccent?: boolean;
}

function MetricFoot({
  label,
  delta,
  deltaTone,
  deltaIcon,
  m,
}: {
  label?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone: NonNullable<MetricProps["deltaTone"]>;
  deltaIcon: IconName;
  m: string;
}) {
  if (label == null && delta == null) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {delta && (
        <Badge tone={deltaTone} icon={deltaIcon}>
          {delta}
        </Badge>
      )}
      {label && <span className={cn("text-ui", m)}>{label}</span>}
    </div>
  );
}

export function Metric({
  value,
  prefix,
  suffix,
  label,
  delta,
  deltaTone = "success",
  deltaIcon = "arrow-up-right",
  size = "md",
  onAccent = false,
  className,
  ref,
  ...props
}: MetricProps) {
  const c = onAccent ? "text-ink-on-signal" : "text-ink-strong";
  const m = onAccent ? "text-ink-on-signal-muted" : "text-ink-muted";
  return (
    <div ref={ref} className={cn("flex min-w-0 flex-col gap-2", className)} {...props}>
      <div
        className={cn(
          "font-display tracking-display flex items-baseline gap-1.5 font-light tabular-nums",
          SIZES[size],
          c,
        )}
      >
        {prefix && <span className={cn("text-unit self-start font-normal", m)}>{prefix}</span>}
        <span>{value}</span>
        {suffix && <span className={cn("text-unit font-normal", m)}>{suffix}</span>}
      </div>
      <MetricFoot label={label} delta={delta} deltaTone={deltaTone} deltaIcon={deltaIcon} m={m} />
    </div>
  );
}
