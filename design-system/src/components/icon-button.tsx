"use client";

import { cn } from "@crm/design-system/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { Icon, type IconName } from "./icon";

const iconButtonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border p-0 outline-none transition-all duration-fast ease-standard focus-visible:shadow-focus active:scale-94 disabled:cursor-not-allowed disabled:opacity-42",
  {
    variants: {
      variant: {
        control:
          "border-line-subtle bg-control text-icon shadow-control hover:bg-control-hover hover:text-icon-strong active:bg-control-active",
        inverse: "border-transparent bg-inverse text-ink-inverse hover:bg-white",
        accent:
          "border-transparent bg-signal text-ink-on-signal hover:bg-signal-hover hover:shadow-glow",
        outline: "border-line-accent text-ink-accent hover:bg-signal-soft",
        ghost: "border-transparent text-icon hover:bg-control hover:text-icon-strong",
        onAccent: "border-transparent bg-abyss-900/10 text-ink-on-signal hover:bg-abyss-900/18",
      },
      size: {
        sm: "size-8.5",
        md: "size-icon-btn",
        lg: "size-13",
      },
    },
    defaultVariants: { variant: "control", size: "md" },
  },
);

const ICON_SIZES = { sm: 16, md: 18, lg: 20 } as const;
const DOT_POSITION = {
  sm: "top-1.5 right-2",
  md: "top-2.5 right-2.5",
  lg: "top-3 right-3",
} as const;

/**
 * Circular icon-only button — card corner actions, toolbar, top bar.
 * Always pass a label.
 */
export type IconButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Accessible label (also used as tooltip title). */
    label: string;
    /** Shows a Verde sinal notification dot. */
    dot?: boolean;
  } & (
    | {
        /** Lucide icon name. */
        icon: IconName;
        asChild?: false;
      }
    | {
        /** Renders the single child (e.g. a router link) with IconButton styling — caller supplies the inner Icon. */
        asChild: true;
        icon?: undefined;
      }
  );

export function IconButton({
  label,
  variant = "control",
  size = "md",
  dot = false,
  disabled = false,
  className,
  type = "button",
  ref,
  ...props
}: IconButtonProps) {
  const { icon, asChild, children, ...rest } = props;
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          <Icon name={icon} size={ICON_SIZES[size ?? "md"]} />
          {dot && (
            <span
              aria-hidden="true"
              className={cn(
                "bg-signal-400 ring-control absolute size-1.5 rounded-full ring-2",
                DOT_POSITION[size ?? "md"],
              )}
            />
          )}
        </>
      )}
    </Comp>
  );
}
