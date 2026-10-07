import type { PaletteColor } from "@crm/core/leads";

interface PaletteStyle {
  /** Small filled dot — stage header, label swatch. */
  dot: string;
  /** Badge/chip background + text. */
  chip: string;
}

/** Maps the fixed COLOR_PALETTE keys to literal Tailwind classes. */
export const PALETTE_STYLES: Record<PaletteColor, PaletteStyle> = {
  gray: { dot: "bg-gray-400", chip: "bg-gray-500/15 text-gray-700 dark:text-gray-300" },
  red: { dot: "bg-red-500", chip: "bg-red-500/15 text-red-700 dark:text-red-300" },
  orange: { dot: "bg-orange-500", chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  amber: { dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  yellow: { dot: "bg-yellow-500", chip: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  green: { dot: "bg-green-500", chip: "bg-green-500/15 text-green-700 dark:text-green-300" },
  teal: { dot: "bg-teal-500", chip: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  blue: { dot: "bg-blue-500", chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  indigo: { dot: "bg-indigo-500", chip: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  purple: { dot: "bg-purple-500", chip: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  pink: { dot: "bg-pink-500", chip: "bg-pink-500/15 text-pink-700 dark:text-pink-300" },
};

export function paletteStyle(color: string): PaletteStyle {
  const key = color as PaletteColor;
  return key in PALETTE_STYLES ? PALETTE_STYLES[key] : PALETTE_STYLES.gray;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatValueCents(valueCents: number): string {
  return currency.format(valueCents / 100);
}
