"use client";

import type { LabelRow, PaletteColor } from "@crm/core/leads";
import { COLOR_PALETTE } from "@crm/core/leads/schemas";
import { Button } from "@crm/design-system/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@crm/design-system/components/dropdown-menu";
import { Input } from "@crm/design-system/components/input";
import { toast } from "@crm/design-system/components/toast";
import { cn } from "@crm/design-system/lib/utils";
import { CheckIcon, TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { paletteStyle } from "@/components/palette";
import { createLabelAction } from "@/server/actions/leads";

interface LabelPickerProps {
  allLabels: LabelRow[];
  selectedIds: string[];
  canCreate: boolean;
  /** Persist the new selection — caller passes the server action bound args. */
  onSave: (labelIds: string[]) => Promise<{ ok: boolean; error?: string }>;
  triggerLabel?: string;
}

/**
 * Checkbox dropdown to apply org labels, with inline create for users with
 * leads:manage. The parent owns persistence via `onSave`.
 */
export function LabelPicker({
  allLabels,
  selectedIds,
  canCreate,
  onSave,
  triggerLabel,
}: LabelPickerProps) {
  const t = useTranslations("leads");
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<PaletteColor>("gray");
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [pending, startTransition] = useTransition();

  function toggle(labelId: string, checked: boolean) {
    const next = checked ? [...selected, labelId] : selected.filter((id) => id !== labelId);
    setSelected(next);
    startTransition(async () => {
      const result = await onSave(next);
      if (!result.ok) {
        setSelected(selected);
        toast.error(result.error ?? t("labelsUpdateFailed"));
      }
    });
  }

  function createLabel() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createLabelAction({ name, color: newColor });
      if (result.ok) {
        setNewName("");
        setSelected((prev) => {
          const next = [...prev, result.data.id];
          void onSave(next);
          return next;
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="sm" disabled={pending}>
          <TagIcon className="size-3.5" />
          {triggerLabel ?? t("labels")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {allLabels.map((label) => {
          const style = paletteStyle(label.color);
          return (
            <DropdownMenuCheckboxItem
              key={label.id}
              checked={selected.includes(label.id)}
              onCheckedChange={(checked) => toggle(label.id, checked === true)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className={cn("size-2 rounded-full", style.dot)} />
              {label.name}
            </DropdownMenuCheckboxItem>
          );
        })}
        {allLabels.length === 0 && !canCreate && (
          <p className="text-ink-muted px-2 py-1.5 text-xs">{t("noLabels")}</p>
        )}
        {canCreate && (
          <>
            <DropdownMenuSeparator />
            <div className="space-y-2 p-2" onKeyDown={(e) => e.stopPropagation()}>
              <Input
                shape="rounded"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("newLabelPlaceholder")}
                className="h-8 text-sm"
                maxLength={40}
              />
              <div className="flex flex-wrap gap-1">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      paletteStyle(color).dot,
                    )}
                  >
                    {newColor === color && <CheckIcon className="size-3 text-white" />}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                iconLeft="plus"
                className="w-full"
                disabled={!newName.trim() || pending}
                onClick={createLabel}
              >
                {t("createLabel")}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
