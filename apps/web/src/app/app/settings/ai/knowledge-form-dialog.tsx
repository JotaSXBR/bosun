"use client";

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
import { Textarea } from "@crm/ui/components/textarea";
import { useTranslations } from "next-intl";

export function KnowledgeFormDialog({
  open,
  onOpenChange,
  editing,
  title,
  setTitle,
  content,
  setContent,
  status,
  setStatus,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  status: "active" | "archived";
  setStatus: (v: "active" | "archived") => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("settings.ai.knowledge");
  const tc = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("new")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="kb-title">{t("titleField")}</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kb-content">{t("content")}</Label>
            <Textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={20000}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("status")}</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "active" | "archived")}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("statusActive")}</SelectItem>
                <SelectItem value="archived">{t("statusArchived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={pending || !title.trim() || !content.trim()}>
            {editing ? tc("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
