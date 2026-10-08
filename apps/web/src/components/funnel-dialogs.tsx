"use client";

import type { PaletteColor, StageRow } from "@crm/core/leads";
import { COLOR_PALETTE } from "@crm/core/leads/schemas";
import { FUNNEL_TEMPLATES } from "@crm/core/leads/templates";
import { Button } from "@crm/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@crm/ui/components/dialog";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { cn } from "@crm/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { paletteStyle } from "@/components/palette";
import {
  createFunnelAction,
  createStageAction,
  deleteFunnelAction,
  deleteStageAction,
  updateStageAction,
} from "@/server/actions/leads";

function ColorField({
  value,
  onChange,
}: {
  value: PaletteColor;
  onChange: (c: PaletteColor) => void;
}) {
  const t = useTranslations("leads");
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={t("colorAria", { color })}
          onClick={() => onChange(color)}
          className={cn(
            "size-6 rounded-full ring-offset-2",
            paletteStyle(color).dot,
            value === color && "ring-foreground ring-2",
          )}
        />
      ))}
    </div>
  );
}

export function NewFunnelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateRef, setTemplateRef] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createFunnelAction({
        name,
        templateRef: templateRef || undefined,
      });
      if (result.ok) {
        toast.success(t("funnelForm.created"));
        onOpenChange(false);
        router.push(`/app/deals?funnel=${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("funnelForm.newTitle")}</DialogTitle>
          <DialogDescription>{t("funnelForm.newDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="funnel-name">{t("funnelForm.name")}</Label>
            <Input
              id="funnel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("funnelForm.namePlaceholder")}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="funnel-template">{t("funnelForm.template")}</Label>
            <Select value={templateRef} onValueChange={setTemplateRef}>
              <SelectTrigger id="funnel-template">
                <SelectValue placeholder={t("funnelForm.templateEmpty")} />
              </SelectTrigger>
              <SelectContent>
                {FUNNEL_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.ref} value={tpl.ref}>
                    {tpl.label} — {t("funnelForm.templateStages", { count: tpl.stages.length })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim() || pending}>
            {t("createFunnel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StageDialog({
  funnelId,
  stage,
  open,
  onOpenChange,
}: {
  funnelId: string;
  stage?: StageRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const tc = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState(stage?.name ?? "");
  const [color, setColor] = useState<PaletteColor>((stage?.color ?? "gray") as PaletteColor);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(stage);

  function submit() {
    startTransition(async () => {
      const result = editing
        ? await updateStageAction({ stageId: stage!.id, name, color })
        : await createStageAction({ funnelId, name, color });
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t("funnelForm.stageEditTitle") : t("funnelForm.stageNewTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stage-name">{t("funnelForm.name")}</Label>
            <Input
              id="stage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("funnelForm.color")}</Label>
            <ColorField value={color} onChange={setColor} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim() || pending}>
            {editing ? tc("save") : t("funnelForm.addStage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFunnelDialog({
  funnelId,
  funnelName,
  open,
  onOpenChange,
}: {
  funnelId: string;
  funnelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteFunnel")}</DialogTitle>
          <DialogDescription>
            {t("funnelForm.deleteFunnelConfirm", { name: funnelName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteFunnelAction(funnelId);
                if (result.ok) {
                  toast.success(t("funnelForm.funnelDeleted"));
                  onOpenChange(false);
                  router.push("/app/deals");
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            {t("deleteFunnel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteStageDialog({
  stage,
  open,
  onOpenChange,
}: {
  stage: StageRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("leads");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteStage")}</DialogTitle>
          <DialogDescription>
            {t("funnelForm.deleteStageConfirm", { name: stage.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteStageAction(stage.id);
                if (result.ok) {
                  onOpenChange(false);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            {t("deleteStage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
