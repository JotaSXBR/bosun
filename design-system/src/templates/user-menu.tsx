"use client";

import * as React from "react";

import { Avatar } from "../components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Icon, type IconName } from "../components/icon";

export interface UserMenuItem {
  icon: IconName;
  label: string;
  href?: string;
  onSelect?: () => void;
}

/**
 * Account menu — avatar trigger with the user's name, e-mail and actions.
 */
export interface UserMenuProps {
  name: string;
  email?: string;
  /** Avatar photo URL. */
  src?: string;
  items: UserMenuItem[];
  /** Rendered when an item has an href. @default "a" */
  linkComponent?: React.ElementType;
  /** Trigger aria-label. @default "Conta" */
  label?: string;
}

export function UserMenu({
  name,
  email,
  src,
  items,
  linkComponent: Link = "a",
  label = "Conta",
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="focus-visible:shadow-focus cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none"
        >
          <Avatar name={name} src={src} size={44} ring={open} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2.5 pt-2 pb-3">
          <div className="text-ink-strong text-sm font-medium">{name}</div>
          {email && <div className="text-ink-muted text-xs">{email}</div>}
        </div>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onSelect={item.href ? undefined : item.onSelect}
            asChild={Boolean(item.href)}
          >
            {item.href ? (
              <Link href={item.href} className="no-underline">
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ) : (
              <>
                <Icon name={item.icon} size={16} />
                {item.label}
              </>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
