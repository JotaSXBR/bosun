import { type IconName, iconPaths } from "@crm/ui/lib/icon-paths";
import { cn } from "@crm/ui/lib/utils";
import type * as React from "react";

/** Lucide line icon, 1.5px stroke by default. Use the kebab-case Lucide name. */
export interface IconProps extends Omit<React.ComponentProps<"svg">, "name" | "color"> {
  /** Lucide icon name — see assets/icons/ for the shipped set. */
  name: IconName;
  /** Pixel size (width = height). @default 20 */
  size?: number;
  /** @default 1.5 */
  strokeWidth?: number;
  /** @default "currentColor" */
  color?: string;
  /** Accessible label; omit for decorative icons. */
  title?: string;
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color = "currentColor",
  title,
  className,
  style,
  ref,
  ...props
}: IconProps) {
  const paths = (iconPaths as Record<string, string | undefined>)[name];
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("block shrink-0", className)}
      style={style}
      // Trusted Lucide path data shipped in this package.
      dangerouslySetInnerHTML={{ __html: paths ?? "" }}
      {...props}
    />
  );
}

export const iconNames = Object.keys(iconPaths) as IconName[];

export type { IconName };
