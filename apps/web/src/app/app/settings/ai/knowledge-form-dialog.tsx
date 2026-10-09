"use client";

import { Button } from "@crm/ui/components/button";
import { Dialog } from "@crm/ui/components/dialog";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import { Select } from "@crm/ui/components/select";
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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={editing ? t("edit") : t("new")}
      description={t("description")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={pending || !title.trim() || !content.trim()}
          >
            {editing ? tc("save") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="kb-title">{t("titleField")}</Label>
          <Input
            shape="rounded"
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
            options={[
              { value: "active", label: t("statusActive") },
              { value: "archived", label: t("statusArchived") },
            ]}
            value={status}
            onChange={(v) => setStatus(v as "active" | "archived")}
            disabled={pending}
          />
        </div>
      </div>
    </Dialog>
  );
}
