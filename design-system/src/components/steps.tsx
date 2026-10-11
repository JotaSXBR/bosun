import { cn } from "@crm/design-system/lib/utils";
import type * as React from "react";

import { Icon } from "./icon";
import { ProgressBar } from "./progress-bar";

export interface StepItem {
  label: React.ReactNode;
  status: "done" | "current" | "pending";
  /** Renders the row as a link (via `linkComponent`). */
  href?: string;
}

/**
 * Checklist de passos com progresso — Zeigarnik + goal gradient: barra +
 * contador "x de y concluídos"; na reta final (falta 1 ou ≥70%) o contador
 * vira "o que falta" com copy motivacional.
 */
export interface StepsProps extends React.ComponentProps<"div"> {
  items: StepItem[];
  /** Elemento de link das linhas com `href`. @default "a" */
  linkComponent?: React.ElementType;
  /** Mostra o contador acima da barra. @default true */
  counter?: boolean;
  /** Contador fora da reta final. @default (d,t) => `${d} de ${t} concluídos` */
  counterLabel?: (done: number, total: number) => React.ReactNode;
  /** Contador na reta final (falta 1 ou ≥70%). @default `Quase lá — falta(m) n` */
  remainingLabel?: (remaining: number) => React.ReactNode;
  /** Estado de conclusão, renderizado no lugar da lista. `null` mantém a lista.
   * @default "Tudo pronto." */
  doneLabel?: React.ReactNode | null;
}

function StepIcon({ status }: { status: StepItem["status"] }) {
  if (status === "done") return <Icon name="circle-check" size={20} className="text-ink-accent" />;
  if (status === "current")
    return <Icon name="circle-play" size={20} className="text-ink-accent" />;
  return <Icon name="circle-dashed" size={20} className="text-ink-subtle" />;
}

function StepRow({
  item,
  linkComponent: Link = "a",
}: {
  item: StepItem;
  linkComponent?: React.ElementType;
}) {
  const row = (
    <>
      <StepIcon status={item.status} />
      <span
        className={cn(
          "text-ui",
          item.status === "done" && "text-ink-muted line-through",
          item.status === "current" && "text-ink-strong font-medium",
          item.status === "pending" && "text-ink-muted",
        )}
      >
        {item.label}
      </span>
    </>
  );
  return item.href ? (
    <Link href={item.href} className="flex items-center gap-2.5">
      {row}
    </Link>
  ) : (
    <span className="flex items-center gap-2.5">{row}</span>
  );
}

export function Steps({
  items,
  linkComponent: Link = "a",
  counter = true,
  counterLabel = (done, total) => `${done} de ${total} concluídos`,
  remainingLabel = (remaining) =>
    remaining === 1 ? "Quase lá — falta 1" : `Quase lá — faltam ${remaining}`,
  doneLabel = "Tudo pronto.",
  className,
  ...props
}: StepsProps) {
  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const remaining = total - done;

  if (total > 0 && remaining === 0 && doneLabel !== null) {
    return (
      <div className={cn("flex items-center gap-2.5", className)} {...props}>
        <Icon name="circle-check" size={20} className="text-ink-accent" />
        <span className="text-ui text-ink-strong font-medium">{doneLabel}</span>
      </div>
    );
  }

  const tail = remaining > 0 && (remaining === 1 || done / total >= 0.7);
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <ProgressBar
        value={done}
        max={Math.max(total, 1)}
        size="sm"
        valueLabel={counter ? (tail ? remainingLabel(remaining) : counterLabel(done, total)) : null}
      />
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i}>
            <StepRow item={item} linkComponent={Link} />
          </li>
        ))}
      </ul>
    </div>
  );
}
