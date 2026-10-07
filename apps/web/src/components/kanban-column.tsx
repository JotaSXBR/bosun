"use client";

import type { DealCardRow, StageRow } from "@crm/core/leads";
import { Button } from "@crm/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@crm/ui/components/dropdown-menu";
import { cn } from "@crm/ui/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";

import { SortableDealCard } from "@/components/deal-card";
import { paletteStyle } from "@/components/palette";

export interface CardCallbacks {
  onEdit: (deal: DealCardRow) => void;
  onLabels: (deal: DealCardRow) => void;
  onDelete: (deal: DealCardRow) => void;
  onMove: (deal: DealCardRow, stageId: string) => void;
}

function StageHeader({
  stage,
  count,
  canManage,
  onEditStage,
  onDeleteStage,
}: {
  stage: StageRow;
  count: number;
  canManage: boolean;
  onEditStage: () => void;
  onDeleteStage: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-0.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className={cn("size-2 shrink-0 rounded-full", paletteStyle(stage.color).dot)} />
        <span className="truncate text-sm font-medium">{stage.name}</span>
        <span className="text-muted-foreground text-xs">{count}</span>
      </div>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0"
              aria-label={`Ações da etapa ${stage.name}`}
            >
              <MoreHorizontalIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEditStage}>Editar etapa</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDeleteStage}>
              Excluir etapa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** Droppable kanban column: stage header + sortable deal cards + "add deal". */
export function KanbanStageColumn({
  stage,
  stages,
  deals,
  canWrite,
  canManage,
  cardCallbacks,
  onEditStage,
  onDeleteStage,
  onAddDeal,
}: {
  stage: StageRow;
  stages: StageRow[];
  deals: DealCardRow[];
  canWrite: boolean;
  canManage: boolean;
  cardCallbacks: CardCallbacks;
  onEditStage: () => void;
  onDeleteStage: () => void;
  onAddDeal: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { type: "stage" } });
  return (
    <div
      ref={setNodeRef}
      data-testid={`stage-column-${stage.id}`}
      className={cn(
        "bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-2",
        isOver && "ring-ring ring-2",
      )}
    >
      <StageHeader
        stage={stage}
        count={deals.length}
        canManage={canManage}
        onEditStage={onEditStage}
        onDeleteStage={onDeleteStage}
      />
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-col gap-2">
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              stages={stages}
              canWrite={canWrite}
              canManage={canManage}
              {...cardCallbacks}
            />
          ))}
        </div>
      </SortableContext>
      {canWrite && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground justify-start"
          onClick={onAddDeal}
        >
          <PlusIcon className="size-3.5" /> Deal
        </Button>
      )}
    </div>
  );
}
