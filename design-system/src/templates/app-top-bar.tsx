"use client";

import { cn } from "@crm/ui/lib/utils";
import type * as React from "react";

import { ModuleNav, type ModuleNavItem } from "../components/module-nav";
import { Wordmark } from "../components/wordmark";

/**
 * Application top bar — brand on the left, module navigation centered,
 * actions on the right. Full nav at `lg`, icon discs below.
 */
export interface AppTopBarProps extends React.ComponentProps<"header"> {
  /** @default <Wordmark size={20} /> */
  brand?: React.ReactNode;
  modules: ModuleNavItem[];
  /** Active module id. */
  active?: string;
  onModuleChange?: (id: string) => void;
  /** Rendered when a module item has an href. @default "a" */
  linkComponent?: React.ElementType;
  /** Right side — typically IconButtons + UserMenu. */
  actions?: React.ReactNode;
}

export function AppTopBar({
  brand,
  modules,
  active,
  onModuleChange,
  linkComponent,
  actions,
  className,
  ...props
}: AppTopBarProps) {
  return (
    <header className={cn("h-nav flex items-center gap-6 px-8", className)} {...props}>
      <div className="flex flex-1 items-center">{brand ?? <Wordmark size={20} />}</div>
      <ModuleNav
        items={modules}
        value={active}
        onChange={onModuleChange}
        linkComponent={linkComponent}
        className="hidden lg:flex"
      />
      <ModuleNav
        items={modules}
        value={active}
        onChange={onModuleChange}
        linkComponent={linkComponent}
        compact
        className="lg:hidden"
      />
      <div className="flex flex-1 items-center justify-end gap-2.5">{actions}</div>
    </header>
  );
}
