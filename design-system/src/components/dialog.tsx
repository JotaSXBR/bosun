"use client";

import { cn } from "@crm/design-system/lib/utils";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { IconButton } from "./icon-button";

/**
 * Modal dialog over a blurred Azul abissal scrim. Esc and scrim click call
 * onClose.
 */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Node left of the title (e.g. icon disc). */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /** Right-aligned actions row. */
  footer?: React.ReactNode;
  /** Max width in px. @default 480 */
  width?: number;
  /** @default "Fechar" */
  closeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  width = 480,
  closeLabel = "Fechar",
  className,
  style,
}: DialogProps) {
  const titleId = React.useId();
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="animate-fade bg-overlay backdrop-blur-overlay fixed inset-0 z-100" />
        {/* Content is the fixed positioning shell (pointer-events-none so clicks
            on the margins reach the scrim and dismiss); the visual panel is the
            inner div, which carries animate-rise so the rise transform never
            fights the centering. */}
        <DialogPrimitive.Content
          aria-labelledby={title ? titleId : `${titleId}-fallback`}
          aria-describedby={undefined}
          className="pointer-events-none fixed inset-0 z-100 grid place-items-center overflow-y-auto p-6 outline-none"
        >
          {!title && (
            <DialogPrimitive.Title asChild>
              <h3 id={`${titleId}-fallback`} className="sr-only">
                Diálogo
              </h3>
            </DialogPrimitive.Title>
          )}
          <div
            className={cn(
              "animate-rise bg-surface text-ink shadow-pop pointer-events-auto flex w-full flex-col rounded-xl",
              className,
            )}
            style={{ maxWidth: width, ...style }}
          >
            <div className="flex items-start gap-4 pt-6 pr-5 pl-6">
              {icon}
              <div className="min-w-0 flex-1 pt-1">
                {title && (
                  <DialogPrimitive.Title asChild>
                    <h3
                      id={titleId}
                      className="font-display text-h4 text-ink-strong tracking-card font-semibold"
                    >
                      {title}
                    </h3>
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description asChild>
                    <p className="text-ink-muted mt-1.5 text-sm">{description}</p>
                  </DialogPrimitive.Description>
                )}
              </div>
              {onClose && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon="x"
                  label={closeLabel}
                  onClick={onClose}
                />
              )}
            </div>
            {children && <div className="px-6 pt-5">{children}</div>}
            {footer ? (
              <div className="flex justify-end gap-2 p-6">{footer}</div>
            ) : (
              <div className="h-6" />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
