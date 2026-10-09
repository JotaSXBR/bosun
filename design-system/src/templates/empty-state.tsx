import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

import { Icon, type IconName } from "../components/icon";

/**
 * Empty result / empty list — icon disc, title, body and optional action on a
 * hatched `bx-grid` card surface.
 */
export interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon: IconName;
  title: string;
  body?: string;
  /** Optional action — typically a Button. */
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, body, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bx-grid rounded-card bg-surface flex flex-col items-center gap-3.5 px-6 py-24 text-center",
        className,
      )}
      {...props}
    >
      <span className="bg-raised text-ink-accent inline-flex size-16 items-center justify-center rounded-full">
        <Icon name={icon} size={26} />
      </span>
      <div className="font-display text-h4 text-ink-strong font-semibold">{title}</div>
      {body && <div className="text-ink-muted max-w-95 text-sm">{body}</div>}
      {action}
    </div>
  );
}
