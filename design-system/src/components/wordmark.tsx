import { cn } from "@crm/ui/lib/utils";
import type * as React from "react";

const SIZES = { sm: 16, md: 22, lg: 32, xl: 56 } as const;

const TONES = {
  default: "text-ink-strong",
  light: "text-mist",
  dark: "text-abyss-900",
  accent: "text-signal-400",
} as const;

/**
 * Typeset BOSUN name (Manrope ExtraBold, +6% tracking). Placeholder for the
 * brand mark — no logo file has been supplied yet.
 */
export interface WordmarkProps extends React.ComponentProps<"span"> {
  /** sm 16 / md 22 / lg 32 / xl 56, or px number. @default "md" */
  size?: keyof typeof SIZES | number;
  /** default follows --text-strong; light/dark force Branco névoa / Azul abissal. @default "default" */
  tone?: keyof typeof TONES;
  /** Adds the institutional signature "Seu mundo digital, sob comando." */
  tagline?: boolean;
}

export function Wordmark({
  size = "md",
  tone = "default",
  tagline = false,
  className,
  style,
  ref,
  ...props
}: WordmarkProps) {
  const fs = typeof size === "number" ? size : SIZES[size];
  return (
    <span
      ref={ref}
      className={cn("inline-flex flex-col", TONES[tone], className)}
      style={{ gap: fs * 0.28, ...style }}
      {...props}
    >
      <span
        className="font-display tracking-wordmark leading-none font-extrabold"
        style={{ fontSize: fs }}
      >
        BOSUN
      </span>
      {tagline && (
        <span
          className="font-sans font-normal opacity-72"
          style={{ fontSize: Math.max(11, fs * 0.42), lineHeight: 1.2 }}
        >
          Seu mundo digital, sob comando.
        </span>
      )}
    </span>
  );
}
