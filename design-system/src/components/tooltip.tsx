"use client";

import { cn } from "@crm/ui/lib/utils";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as React from "react";

type TooltipTone = "inverse" | "accent" | "default";

const TONES: Record<TooltipTone, string> = {
  inverse: "bg-inverse text-ink-inverse",
  accent: "bg-signal text-ink-on-signal",
  default: "bg-raised-2 text-ink-strong",
};

/** The static bubble + pin, for placing manually (e.g. above a chart bar). */
export interface TooltipBubbleProps extends React.ComponentProps<"span"> {
  tone?: TooltipTone;
  /** Stem length in px; 0 hides it. @default 8 */
  stem?: number;
  placement?: "top" | "bottom";
}

export function TooltipBubble({
  children,
  tone = "inverse",
  stem = 8,
  placement = "top",
  className,
  style,
  ref,
  ...props
}: TooltipBubbleProps) {
  const bubble = (
    <span
      className={cn(
        "rounded-pill shadow-bubble inline-flex h-6.5 items-center gap-1 px-2.5 font-sans text-xs font-semibold whitespace-nowrap tabular-nums",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
  const pin = stem ? (
    <span className={cn("w-0.5", TONES[tone].split(" ")[0])} style={{ height: stem }} />
  ) : null;
  return (
    <span
      ref={ref}
      className={cn("pointer-events-none inline-flex flex-col items-center", className)}
      style={style}
      {...props}
    >
      {placement === "top" ? (
        <>
          {bubble}
          {pin}
        </>
      ) : (
        <>
          {pin}
          {bubble}
        </>
      )}
    </span>
  );
}

/**
 * Hover label with a hairline "pin" stem — for icon buttons and chart values.
 */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** inverse = Branco névoa; accent = Verde sinal (chart highlights); default = raised dark. @default "inverse" */
  tone?: TooltipTone;
  /** @default "top" */
  placement?: "top" | "bottom";
  /** Force visibility (controlled). */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Tooltip({
  content,
  children,
  tone = "inverse",
  placement = "top",
  open,
  className,
  style,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root open={open}>
        <TooltipPrimitive.Trigger asChild>
          <span className={cn("inline-flex", className)} style={style}>
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={placement} sideOffset={4} className="animate-fade z-110">
            <TooltipBubble tone={tone} placement={placement} stem={6}>
              {content}
            </TooltipBubble>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
