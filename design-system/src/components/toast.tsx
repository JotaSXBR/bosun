"use client";

import { cn } from "@crm/design-system/lib/utils";
import * as React from "react";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

import { Icon, type IconName } from "./icon";
import { IconButton } from "./icon-button";

type ToastTone = "success" | "warning" | "danger" | "info" | "running";

const TONES: Record<ToastTone, { icon: IconName; fg: string; bg: string }> = {
  success: { icon: "circle-check", fg: "text-success", bg: "bg-success-soft" },
  warning: { icon: "triangle-alert", fg: "text-warning", bg: "bg-warning-soft" },
  danger: { icon: "circle-alert", fg: "text-danger", bg: "bg-danger-soft" },
  info: { icon: "info", fg: "text-info", bg: "bg-info-soft" },
  running: { icon: "loader", fg: "text-running", bg: "bg-running-soft" },
};

/** Transient status message — results of an action, flow completion, connection errors. */
export interface ToastProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** @default "success" */
  tone?: ToastTone;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons rendered below the text (sm size). */
  action?: React.ReactNode;
  onClose?: () => void;
  /** @default "Dispensar" */
  dismissLabel?: string;
}

export function Toast({
  tone = "success",
  title,
  description,
  action,
  onClose,
  dismissLabel = "Dispensar",
  className,
  ref,
  ...props
}: ToastProps) {
  const t = TONES[tone];
  return (
    <div
      ref={ref}
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "bg-raised text-ink shadow-pop box-border flex w-100 max-w-full items-start gap-3.5 rounded-lg py-3.5 pr-3 pl-3.5",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex size-8.5 shrink-0 items-center justify-center rounded-full",
          t.bg,
          t.fg,
        )}
      >
        <Icon
          name={t.icon}
          size={18}
          className={tone === "running" ? "animate-loader" : undefined}
        />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {title && <div className="text-ink-strong text-sm font-medium">{title}</div>}
        {description && <div className="text-ui text-ink-muted mt-0.5">{description}</div>}
        {action && <div className="mt-2.5 flex gap-2">{action}</div>}
      </div>
      {onClose && (
        <IconButton size="sm" variant="ghost" icon="x" label={dismissLabel} onClick={onClose} />
      )}
    </div>
  );
}

type ToastInput = {
  tone?: ToastTone;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  dismissLabel?: string;
};

/** Imperative toast — renders <Toast> through Sonner. */
function toast(input: ToastInput) {
  return sonnerToast.custom(
    (id) => (
      <Toast
        tone={input.tone}
        title={input.title}
        description={input.description}
        action={input.action}
        dismissLabel={input.dismissLabel}
        onClose={() => sonnerToast.dismiss(id)}
      />
    ),
    { duration: input.duration },
  );
}

toast.success = (title: React.ReactNode, opts: Omit<ToastInput, "tone" | "title"> = {}) =>
  toast({ ...opts, tone: "success", title });
toast.warning = (title: React.ReactNode, opts: Omit<ToastInput, "tone" | "title"> = {}) =>
  toast({ ...opts, tone: "warning", title });
toast.error = (title: React.ReactNode, opts: Omit<ToastInput, "tone" | "title"> = {}) =>
  toast({ ...opts, tone: "danger", title });
toast.info = (title: React.ReactNode, opts: Omit<ToastInput, "tone" | "title"> = {}) =>
  toast({ ...opts, tone: "info", title });
toast.running = (title: React.ReactNode, opts: Omit<ToastInput, "tone" | "title"> = {}) =>
  toast({ ...opts, tone: "running", title });
toast.dismiss = (id?: string | number) => sonnerToast.dismiss(id);

/** Host for imperative toasts — bottom-right stack, 400px cards. */
export function Toaster() {
  return (
    <SonnerToaster position="bottom-right" offset={24} gap={8} toastOptions={{ unstyled: true }} />
  );
}

export { toast };
