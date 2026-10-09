import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

const SIZES = { xs: 24, sm: 32, md: 40, lg: 48, xl: 72 } as const;

const STATUS_COLORS = {
  online: "bg-signal-400",
  busy: "bg-warning",
  offline: "bg-steel-500",
} as const;

/** Person avatar — monochrome photo or initials on Azul oceano. */
export interface AvatarProps extends React.ComponentProps<"span"> {
  /** Photo URL — rendered grayscale per brand imagery rules. */
  src?: string;
  /** Used for initials and alt text. */
  name?: string;
  /** xs 24 / sm 32 / md 40 / lg 48 / xl 72, or a pixel number. @default "md" */
  size?: keyof typeof SIZES | number;
  /** Verde sinal ring — current user / owner. */
  ring?: boolean;
  status?: keyof typeof STATUS_COLORS;
}

export function Avatar({
  src,
  name = "",
  size = "md",
  ring = false,
  status,
  className,
  style,
  ref,
  ...props
}: AvatarProps) {
  const d = typeof size === "number" ? size : SIZES[size];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const statusSize = Math.max(8, d * 0.24);
  return (
    <span
      ref={ref}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: d, height: d, ...style }}
      {...props}
    >
      <span
        className={cn(
          "font-display tracking-card inline-flex size-full items-center justify-center overflow-hidden rounded-full font-semibold",
          ring
            ? "bg-signal-400 text-abyss-900 ring-signal-400 ring-offset-page ring-2 ring-offset-2"
            : "bg-ocean-700 text-ocean-100 ring-line-subtle ring-1 ring-inset",
        )}
        style={{ fontSize: Math.round(d * 0.38) }}
      >
        {src ? (
          <img src={src} alt={name} className="size-full object-cover contrast-105 grayscale" />
        ) : (
          initials
        )}
      </span>
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "ring-page absolute right-0 bottom-0 rounded-full ring-2",
            STATUS_COLORS[status],
          )}
          style={{ width: statusSize, height: statusSize }}
        />
      )}
    </span>
  );
}
