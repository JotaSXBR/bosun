"use client";

// Aside visibility shell (spec inbox-ui-review C3 + D3): open inline at
// xl+ with a collapse strip, an overlay drawer under xl. Two independent
// states — no media-query effect, no SSR flicker: `desktopOpen` defaults
// true, `mobileOpen` false.
import { Icon } from "@crm/design-system/components/icon";
import { cn } from "@crm/design-system/lib/utils";
import { useState } from "react";

export function AsideShell({
  children,
  openLabel,
  closeLabel,
}: {
  children: React.ReactNode;
  openLabel: string;
  closeLabel: string;
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* <xl drawer trigger — floats above the thread. */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={openLabel}
        className="bg-raised border-line text-ink shadow-pop fixed right-4 bottom-4 z-30 flex size-10 items-center justify-center rounded-full border xl:hidden"
      >
        <Icon name="panel-left" className="size-4" />
      </button>
      {mobileOpen && (
        <button
          type="button"
          aria-label={closeLabel}
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        data-open={desktopOpen || undefined}
        className={cn(
          "border-line bg-page fixed inset-y-0 right-0 z-40 w-80 shrink-0 overflow-y-auto border-l p-4 transition-transform",
          "wide:w-inbox-aside xl:w-inbox-aside-sm xl:static xl:z-auto xl:translate-x-0",
          mobileOpen ? "translate-x-0" : "max-xl:translate-x-full",
          desktopOpen ? "xl:block" : "xl:hidden",
        )}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setDesktopOpen(false);
            }}
            aria-label={closeLabel}
            className="text-ink-muted hover:text-ink rounded-xs p-1"
          >
            <Icon name="x" className="size-4" />
          </button>
        </div>
        {children}
      </aside>
      {/* xl+ collapsed strip — the affordance that re-opens the aside. */}
      {!desktopOpen && (
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
          aria-label={openLabel}
          className="border-line bg-page text-ink-muted hover:text-ink hidden w-9 shrink-0 items-start justify-center border-l pt-4 xl:flex"
        >
          <Icon name="panel-left" className="size-4" />
        </button>
      )}
    </>
  );
}
