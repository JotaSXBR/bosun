import { cn } from "@crm/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { Icon, type IconName } from "./icon";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill font-sans leading-none font-medium whitespace-nowrap tabular-nums select-none",
  {
    variants: {
      tone: {
        neutral: "",
        accent: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
        running: "",
      },
      variant: {
        soft: "",
        solid: "",
      },
      size: {
        sm: "h-5 gap-1 px-2 text-2xs",
        md: "h-6 gap-1.5 px-2.5 text-xs",
      },
    },
    compoundVariants: [
      { variant: "soft", tone: "neutral", class: "bg-raised-2 text-ink" },
      { variant: "soft", tone: "accent", class: "bg-signal-soft text-ink-accent" },
      { variant: "soft", tone: "success", class: "bg-success-soft text-success" },
      { variant: "soft", tone: "warning", class: "bg-warning-soft text-warning" },
      { variant: "soft", tone: "danger", class: "bg-danger-soft text-danger" },
      { variant: "soft", tone: "info", class: "bg-info-soft text-info" },
      { variant: "soft", tone: "running", class: "bg-running-soft text-running" },
      { variant: "solid", tone: "neutral", class: "bg-steel-300 text-abyss-900" },
      { variant: "solid", tone: "accent", class: "bg-signal-400 text-abyss-900" },
      { variant: "solid", tone: "success", class: "bg-success text-abyss-900" },
      { variant: "solid", tone: "warning", class: "bg-warning text-abyss-900" },
      { variant: "solid", tone: "danger", class: "bg-danger text-abyss-900" },
      { variant: "solid", tone: "info", class: "bg-info text-abyss-900" },
      { variant: "solid", tone: "running", class: "bg-running text-abyss-900" },
    ],
    defaultVariants: { tone: "neutral", variant: "soft", size: "md" },
  },
);

const DOT_TONES = {
  neutral: "bg-steel-300",
  accent: "bg-signal-400",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  running: "bg-running",
} as const;

type BadgeTone = keyof typeof DOT_TONES;

/** Compact status / delta pill. */
export interface BadgeProps
  extends React.ComponentProps<"span">, Omit<VariantProps<typeof badgeVariants>, "tone"> {
  /** @default "neutral" */
  tone?: BadgeTone;
  /** Lucide icon (e.g. "arrow-up-right" for growth deltas). */
  icon?: IconName;
  /** Leading status dot; pulses when tone="running". */
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  variant = "soft",
  icon,
  dot = false,
  size = "md",
  className,
  children,
  ref,
  ...props
}: BadgeProps) {
  const solid = variant === "solid";
  return (
    <span ref={ref} className={cn(badgeVariants({ tone, variant, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            solid ? "bg-abyss-900" : DOT_TONES[tone],
            tone === "running" && "animate-pulse-dot",
          )}
        />
      )}
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 13} strokeWidth={2} />}
      {children}
    </span>
  );
}
