import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

/**
 * App-format shell — fixed `100dvh` grid: `topBar` and `header` stay pinned
 * while the content region scrolls on its own (each panel inside may scroll
 * independently). Pages keep their own container/padding.
 */
export interface AppShellProps extends React.ComponentProps<"div"> {
  /** Fixed top region — typically `AppTopBar`. */
  topBar: React.ReactNode;
  /** Optional fixed header under the bar — typically `PageHeader`. */
  header?: React.ReactNode;
  /** Work region — grows to fill the remaining height and scrolls itself. */
  children: React.ReactNode;
}

export function AppShell({ topBar, header, children, className, ...props }: AppShellProps) {
  return (
    <div className={cn("flex h-dvh flex-col overflow-hidden", className)} {...props}>
      {topBar}
      {header}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
