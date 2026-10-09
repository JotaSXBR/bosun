import type * as React from "react";

export const eyebrow = "font-mono text-2xs font-medium tracking-eyebrow uppercase text-ink-subtle";
export const sectionTitle = "font-display text-h3 font-semibold text-ink-strong";
export const groupTitle = "font-display text-h4 font-medium text-ink-strong";

export function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className={groupTitle}>{title}</h3>}
      {children}
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className={eyebrow}>{label}</span>
      {children}
    </div>
  );
}
