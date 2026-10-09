"use client";

import { cn } from "@crm/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { Icon, type IconName } from "./icon";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border font-sans leading-none font-medium tracking-ui whitespace-nowrap outline-none transition-all duration-fast ease-standard select-none focus-visible:shadow-focus active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-42 data-[loading=true]:cursor-progress",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-signal text-ink-on-signal hover:bg-signal-hover hover:shadow-glow",
        secondary:
          "border-line-subtle bg-control text-ink-strong shadow-control hover:bg-control-hover active:bg-control-active",
        outline: "border-line-accent text-ink-accent hover:bg-signal-soft",
        ghost: "border-transparent text-ink hover:bg-control",
        inverse: "border-transparent bg-inverse text-ink-inverse hover:bg-white",
        danger:
          "border-transparent bg-danger-soft text-danger hover:bg-danger hover:text-abyss-900",
      },
      size: {
        sm: "h-control-sm gap-1.5 px-3.5 text-ui",
        md: "h-control-md gap-2 px-4.5 text-sm",
        lg: "h-control-lg gap-2.5 px-6 text-ui-lg",
      },
      fullWidth: {
        true: "flex w-full",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

const ICON_SIZES = { sm: 16, md: 18, lg: 20 } as const;

function busyState(disabled: boolean, loading: boolean) {
  return {
    disabled: disabled || loading,
    "aria-busy": loading || undefined,
    "data-loading": loading || undefined,
  };
}

/**
 * Pill-shaped action button. One primary (Verde sinal) per view region.
 */
export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Lucide icon name rendered before the label. */
  iconLeft?: IconName;
  /** Lucide icon name rendered after the label. */
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  asChild = false,
  type = "button",
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const iconSize = ICON_SIZES[size ?? "md"];
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      {...busyState(disabled, loading)}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <Content loading={loading} iconLeft={iconLeft} iconRight={iconRight} iconSize={iconSize}>
          {children}
        </Content>
      )}
    </Comp>
  );
}

function Content({
  loading,
  iconLeft,
  iconRight,
  iconSize,
  children,
}: {
  loading: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  iconSize: number;
  children: React.ReactNode;
}) {
  const left = loading ? (
    <Icon name="loader" size={iconSize} className="animate-loader" />
  ) : iconLeft ? (
    <Icon name={iconLeft} size={iconSize} />
  ) : null;
  return (
    <>
      {left}
      {children != null && <span>{children}</span>}
      {iconRight != null && !loading && <Icon name={iconRight} size={iconSize} />}
    </>
  );
}

export { buttonVariants };
