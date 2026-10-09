import { cn } from "@crm/ui/lib/utils";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-line bg-sunken text-ink-strong placeholder:text-ink-subtle focus-visible:border-line-accent focus-visible:shadow-halo aria-invalid:border-danger aria-invalid:shadow-halo-danger flex field-sizing-content min-h-16 w-full rounded-md border px-4 py-3 text-sm transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
