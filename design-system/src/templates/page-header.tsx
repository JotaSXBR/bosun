import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

import { Icon } from "../components/icon";
import { IconButton } from "../components/icon-button";
import { type TabItem, Tabs } from "../components/tabs";
import { Tag } from "../components/tag";

export interface PageHeaderBack {
  /** Navigates via `linkComponent`. */
  href?: string;
  onClick?: () => void;
  /** Accessible label — default "Voltar". */
  label?: string;
}

/**
 * Page title block — display-size `h1` with optional tabs, applied filters
 * (removable Tags) and a right-aligned action area. `compact` is the 56px
 * variant for work modules (title h3, tabs on the same line); `back` adds an
 * in-app back arrow before the title.
 */
export interface PageHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  /** Compact 56px header (page-header-compact) for work modules. */
  compact?: boolean;
  /** In-app back — arrow-left IconButton before the title. */
  back?: PageHeaderBack;
  /** Router link used for `back.href` (default "a"). */
  linkComponent?: React.ElementType;
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
  compact = false,
  back,
  linkComponent: Link = "a",
  tabs,
  tab,
  onTab,
  filters,
  onRemoveFilter,
  right,
  className,
  ...props
}: PageHeaderProps) {
  const Title = compact ? "h3" : "h1";
  return (
    <div
      className={cn(
        "flex items-center",
        compact ? "h-page-header-compact gap-6" : "flex-wrap gap-12 pt-5 pb-7",
        className,
      )}
      {...props}
    >
      {back && <BackButton back={back} Link={Link} />}
      <Title
        className={cn(
          "font-display text-ink-strong font-semibold",
          compact ? "text-h3" : "text-page-title",
        )}
      >
        {title}
      </Title>
      {tabs && (
        <Tabs items={tabs} value={tab} onChange={onTab} className={compact ? undefined : "mt-2"} />
      )}
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

function BackButton({ back, Link }: { back: PageHeaderBack; Link: React.ElementType }) {
  const label = back.label ?? "Voltar";
  if (back.href) {
    return (
      <IconButton asChild variant="ghost" label={label} className="shrink-0">
        <Link href={back.href}>
          <Icon name="arrow-left" size={18} />
        </Link>
      </IconButton>
    );
  }
  return (
    <IconButton
      icon="arrow-left"
      variant="ghost"
      label={label}
      onClick={back.onClick}
      className="shrink-0"
    />
  );
}
