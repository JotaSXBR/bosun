import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

import { type TabItem, Tabs } from "../components/tabs";
import { Tag } from "../components/tag";

/**
 * Page title block — display-size `h1` with optional tabs, applied filters
 * (removable Tags) and a right-aligned action area.
 */
export interface PageHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  /** Tab items rendered next to the title. */
  tabs?: Array<string | TabItem>;
  tab?: string;
  onTab?: (value: string) => void;
  /** Applied filter chips — rendered as removable Tags. */
  filters?: string[];
  onRemoveFilter?: (filter: string) => void;
  /** Right side — actions, selects, icon buttons. */
  right?: React.ReactNode;
}

export function PageHeader({
  title,
  tabs,
  tab,
  onTab,
  filters,
  onRemoveFilter,
  right,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-12 pt-5 pb-7", className)} {...props}>
      <h1 className="font-display text-page-title text-ink-strong font-semibold">{title}</h1>
      {tabs && <Tabs items={tabs} value={tab} onChange={onTab} className="mt-2" />}
      <div className="flex-1" />
      {((filters?.length ?? 0) > 0 || right) && (
        <div className="flex items-center gap-2">
          {filters?.map((f) => (
            <Tag key={f} onRemove={() => onRemoveFilter?.(f)}>
              {f}
            </Tag>
          ))}
          {right}
        </div>
      )}
    </div>
  );
}
